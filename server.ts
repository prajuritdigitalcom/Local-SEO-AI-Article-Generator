import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import {
  getAllBatches,
  getBatchById,
  saveBatch,
  updateBatchItem,
  deleteBatch,
  cleanupOldBatches,
} from './src/lib/serverStorage';
import {
  buildPrompt,
  cleanupArticle,
  countWords,
  detectLocationContext,
  generateVariationSeed,
} from './src/lib/promptBuilder';
import { Batch, GenerationItem, CreateBatchInput } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to generate UUIDs
function generateId(): string {
  return 'b_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

// Global active SSE connections per batchId: batchId -> Set<Response>
const sseSubscribers = new Map<string, Set<Response>>();

function broadcastBatchUpdate(batchId: string, batch: Batch) {
  const clients = sseSubscribers.get(batchId);
  if (clients) {
    const data = `data: ${JSON.stringify(batch)}\n\n`;
    for (const res of clients) {
      res.write(data);
    }
  }
}

// Server Key Cooldown Tracker: keyIndex -> cooldownUntilTimestamp
const keyCooldowns = new Map<number, number>();

function getServerKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEYS) {
    const split = process.env.GEMINI_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean);
    keys.push(...split);
  }
  if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY.trim())) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }
  return keys;
}

function parseUserKeys(headerValue?: string | string[]): string[] {
  if (!headerValue) return [];
  const rawStr = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;
  try {
    const decoded = decodeURIComponent(rawStr);
    return decoded
      .split(/[\n\r,]+/)
      .map((k) => k.trim())
      .filter(Boolean);
  } catch (err) {
    console.warn('[Vercel/Server Log] Gagal decode x-user-gemini-key header:', err);
    return rawStr
      .split(/[\n\r,]+/)
      .map((k) => k.trim())
      .filter(Boolean);
  }
}

async function callGeminiWithRotation(params: {
  promptText: string;
  userKeys: string[];
}): Promise<{ text: string; keyUsedIndex: number }> {
  const { promptText, userKeys } = params;

  // Determine key pool: user keys take priority if provided
  const keysToUse = userKeys.length > 0 ? userKeys : getServerKeys();

  if (keysToUse.length === 0) {
    throw new Error('NO_API_KEYS_CONFIGURED');
  }

  let lastError: any = null;
  const now = Date.now();

  for (let i = 0; i < keysToUse.length; i++) {
    // Check if key is currently in cooldown (skip for 60 seconds after rate limit)
    const cooldownUntil = keyCooldowns.get(i) || 0;
    if (cooldownUntil > now && keysToUse.length > 1) {
      console.log(`[Key Rotation] Key #${i} is in cooldown, skipping...`);
      continue;
    }

    const apiKey = keysToUse[i];

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptText,
      });

      const text = response.text || '';
      if (!text) {
        throw new Error('EMPTY_RESPONSE');
      }

      return { text, keyUsedIndex: i };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini API Warning] Key #${i} failed:`, errMsg);

      // Check for rate limit / quota exhaustion
      if (
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota') ||
        errMsg.includes('Rate limit')
      ) {
        // Set 60s cooldown for this key index
        keyCooldowns.set(i, Date.now() + 60000);
      }
    }
  }

  throw lastError || new Error('ALL_KEYS_EXHAUSTED');
}

// Background Processing Queue
interface JobTask {
  batchId: string;
  itemId: string;
  userKeys: string[];
}

const jobQueue: JobTask[] = [];
let activeWorkers = 0;
const MAX_CONCURRENT_WORKERS = 3;

function enqueueJob(batchId: string, itemId: string, userKeys: string[]) {
  jobQueue.push({ batchId, itemId, userKeys });
  processQueue();
}

function processQueue() {
  while (activeWorkers < MAX_CONCURRENT_WORKERS && jobQueue.length > 0) {
    const task = jobQueue.shift();
    if (task) {
      activeWorkers++;
      executeTask(task).finally(() => {
        activeWorkers--;
        processQueue();
      });
    }
  }
}

async function executeTask(task: JobTask) {
  const { batchId, itemId, userKeys } = task;

  const batch = getBatchById(batchId);
  if (!batch) return;

  const item = batch.items.find((i) => i.id === itemId);
  if (!item || item.status !== 'pending') return;

  // Mark item as processing
  let updatedBatch = updateBatchItem(batchId, itemId, (i) => ({
    ...i,
    status: 'processing',
    updatedAt: new Date().toISOString(),
  }));

  if (updatedBatch) broadcastBatchUpdate(batchId, updatedBatch);

  const startTime = Date.now();
  const seed = generateVariationSeed();
  const isLocal = detectLocationContext(item.keyword);

  const itemTarget =
    item.targetWordCount ||
    (typeof batch.targetWordCount === 'number' ? batch.targetWordCount : 500);

  const { promptText, resolvedStyleName } = buildPrompt({
    keyword: item.keyword,
    referenceInfo: batch.referenceInfo,
    languageStyle: batch.languageStyle,
    targetWordCount: itemTarget,
    seed,
  });

  try {
    const { text, keyUsedIndex } = await callGeminiWithRotation({
      promptText,
      userKeys,
    });

    const durationMs = Date.now() - startTime;
    const cleanedArticle = cleanupArticle(text);
    const actualWordCount = countWords(cleanedArticle);

    updatedBatch = updateBatchItem(batchId, itemId, (i) => ({
      ...i,
      status: 'success',
      article: cleanedArticle,
      actualWordCount,
      languageStyleUsed: resolvedStyleName,
      localContextDetected: isLocal,
      errorReason: null,
      generationTimeMs: durationMs,
      updatedAt: new Date().toISOString(),
    }));
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const errMsg = err?.message || String(err);
    console.error(`[Vercel/Server Log] Task Execution Error for item ${itemId} (batch ${batchId}):`, errMsg, err?.stack || '');

    let errorReason = 'Gagal menghasilkan artikel dari AI.';
    if (errMsg.includes('NO_API_KEYS_CONFIGURED')) {
      errorReason = 'Belum ada API Key Gemini aktif (Server atau User).';
    } else if (errMsg.includes('ALL_KEYS_EXHAUSTED') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      errorReason = 'Semua API Key Gemini sedang mencapai limit kuota. Silakan coba lagi sebentar.';
    }

    updatedBatch = updateBatchItem(batchId, itemId, (i) => ({
      ...i,
      status: 'failed',
      article: null,
      actualWordCount: null,
      errorReason,
      generationTimeMs: durationMs,
      updatedAt: new Date().toISOString(),
    }));
  }

  if (updatedBatch) broadcastBatchUpdate(batchId, updatedBatch);
}

// API ROUTES

// Server health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Settings & Server Keys status check
app.get('/api/settings/keys', (req, res) => {
  const keys = getServerKeys();
  res.json({
    hasServerKey: keys.length > 0,
    totalServerKeys: keys.length,
    activeKeys: keys.length,
  });
});

// List recent batches
app.get('/api/batches', (req, res) => {
  cleanupOldBatches();
  const batches = getAllBatches();
  // Return summary without heavy article contents for list view
  const summaries = batches.map((b) => ({
    id: b.id,
    createdAt: b.createdAt,
    totalItems: b.totalItems,
    completedItems: b.completedItems,
    status: b.status,
    languageStyle: b.languageStyle,
    targetWordCount: b.targetWordCount,
    keywordsSample: b.items.slice(0, 3).map((i) => i.keyword),
  }));
  res.json(summaries);
});

// Get single batch
app.get('/api/batch/:batchId', (req, res) => {
  const batch = getBatchById(req.params.batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch tidak ditemukan' });
  }
  res.json(batch);
});

// Delete batch
app.delete('/api/batch/:batchId', (req, res) => {
  const success = deleteBatch(req.params.batchId);
  if (!success) {
    return res.status(404).json({ error: 'Batch tidak ditemukan' });
  }
  res.json({ success: true });
});

// SSE Stream for batch progress updates
app.get('/api/batch/:batchId/stream', (req: Request, res: Response) => {
  const batchId = req.params.batchId;
  const batch = getBatchById(batchId);

  if (!batch) {
    return res.status(404).json({ error: 'Batch tidak ditemukan' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state immediately
  res.write(`data: ${JSON.stringify(batch)}\n\n`);

  if (!sseSubscribers.has(batchId)) {
    sseSubscribers.set(batchId, new Set());
  }
  sseSubscribers.get(batchId)!.add(res);

  req.on('close', () => {
    const clients = sseSubscribers.get(batchId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseSubscribers.delete(batchId);
      }
    }
  });
});

// Create Batch
app.post('/api/batch/create', (req: Request, res: Response) => {
  const { keywords, referenceInfo, languageStyle, targetWordCount } = req.body as CreateBatchInput;

  const userKeys = parseUserKeys(req.headers['x-user-gemini-key']);

  // Validations
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({ error: 'Masukkan minimal 1 kata kunci valid.' });
  }

  // Filter and trim keywords
  const validKeywords = keywords
    .map((k) => k.trim())
    .filter((k) => k.length >= 3 && k.length <= 150);

  if (validKeywords.length === 0) {
    return res.status(400).json({ error: 'Tidak ada kata kunci valid (minimal 3 karakter per baris).' });
  }

  if (validKeywords.length > 50) {
    return res.status(400).json({ error: 'Maksimum 50 kata kunci per batch.' });
  }

  if (!referenceInfo || referenceInfo.trim().length < 20) {
    return res.status(400).json({ error: 'Informasi referensi minimal 20 karakter.' });
  }

  if (referenceInfo.length > 3000) {
    return res.status(400).json({ error: 'Informasi referensi maksimum 3000 karakter.' });
  }

  const batchId = generateId();
  const now = new Date().toISOString();

  const WORD_COUNT_OPTIONS = [300, 400, 500, 600, 700, 800, 1000];

  const items: GenerationItem[] = validKeywords.map((kw, idx) => {
    const itemTarget =
      targetWordCount === 'random'
        ? WORD_COUNT_OPTIONS[Math.floor(Math.random() * WORD_COUNT_OPTIONS.length)]
        : typeof targetWordCount === 'number'
        ? targetWordCount
        : 500;

    return {
      id: `item_${batchId}_${idx}`,
      batchId,
      keyword: kw,
      status: 'pending',
      article: null,
      actualWordCount: null,
      targetWordCount: itemTarget,
      languageStyleUsed: null,
      localContextDetected: null,
      errorReason: null,
      generationTimeMs: null,
      createdAt: now,
      updatedAt: now,
    };
  });

  const batch: Batch = {
    id: batchId,
    createdAt: now,
    referenceInfo: referenceInfo.trim(),
    languageStyle: languageStyle || 'formal-informatif',
    targetWordCount: targetWordCount || 500,
    totalItems: items.length,
    completedItems: 0,
    status: 'processing',
    items,
  };

  saveBatch(batch);

  // Enqueue all items for processing
  for (const item of items) {
    enqueueJob(batchId, item.id, userKeys);
  }

  res.json({
    batchId,
    totalItems: items.length,
  });
});

// Retry a specific item
app.post('/api/batch/:batchId/retry/:itemId', (req: Request, res: Response) => {
  const { batchId, itemId } = req.params;
  const userKeys = parseUserKeys(req.headers['x-user-gemini-key']);

  const batch = getBatchById(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch tidak ditemukan' });
  }

  const item = batch.items.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item tidak ditemukan' });
  }

  const updatedBatch = updateBatchItem(batchId, itemId, (i) => ({
    ...i,
    status: 'pending',
    errorReason: null,
    updatedAt: new Date().toISOString(),
  }));

  if (updatedBatch) broadcastBatchUpdate(batchId, updatedBatch);

  enqueueJob(batchId, itemId, userKeys);

  res.json({ success: true });
});

// Regenerate a specific item (with new variation seed)
app.post('/api/batch/:batchId/regenerate/:itemId', (req: Request, res: Response) => {
  const { batchId, itemId } = req.params;
  const userKeys = parseUserKeys(req.headers['x-user-gemini-key']);

  const batch = getBatchById(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch tidak ditemukan' });
  }

  const item = batch.items.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item tidak ditemukan' });
  }

  const updatedBatch = updateBatchItem(batchId, itemId, (i) => ({
    ...i,
    status: 'pending',
    errorReason: null,
    updatedAt: new Date().toISOString(),
  }));

  if (updatedBatch) broadcastBatchUpdate(batchId, updatedBatch);

  enqueueJob(batchId, itemId, userKeys);

  res.json({ success: true });
});

// Update item text manually (in-place edit)
app.post('/api/batch/:batchId/edit/:itemId', (req: Request, res: Response) => {
  const { batchId, itemId } = req.params;
  const { article } = req.body;

  if (typeof article !== 'string') {
    return res.status(400).json({ error: 'Isi artikel harus berupa teks.' });
  }

  const newWordCount = countWords(article);

  const updatedBatch = updateBatchItem(batchId, itemId, (i) => ({
    ...i,
    article,
    actualWordCount: newWordCount,
    updatedAt: new Date().toISOString(),
  }));

  if (!updatedBatch) {
    return res.status(404).json({ error: 'Batch atau Item tidak ditemukan' });
  }

  broadcastBatchUpdate(batchId, updatedBatch);
  res.json(updatedBatch);
});

// Start server
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Local SEO Article Generator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
