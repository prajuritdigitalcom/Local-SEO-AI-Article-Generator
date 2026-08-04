import fs from 'fs';
import path from 'path';
import { Batch, GenerationItem } from '../types';

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.NOW_REGION);
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const BATCHES_FILE = path.join(DATA_DIR, 'batches.json');
const RETENTION_DAYS = 30;

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(BATCHES_FILE)) {
    fs.writeFileSync(BATCHES_FILE, JSON.stringify([]), 'utf8');
  }
} catch (err) {
  console.warn('[ServerStorage] Warning initializing storage directory:', err);
}

export function getAllBatches(): Batch[] {
  try {
    const data = fs.readFileSync(BATCHES_FILE, 'utf8');
    const batches: Batch[] = JSON.parse(data);
    return batches;
  } catch (err) {
    console.error('Error reading batches file:', err);
    return [];
  }
}

export function saveAllBatches(batches: Batch[]): void {
  try {
    // Atomic write using a temp file
    const tempFile = `${BATCHES_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(batches, null, 2), 'utf8');
    fs.renameSync(tempFile, BATCHES_FILE);
  } catch (err) {
    console.error('Error saving batches file:', err);
  }
}

export function getBatchById(id: string): Batch | undefined {
  const batches = getAllBatches();
  return batches.find((b) => b.id === id);
}

export function saveBatch(batch: Batch): void {
  const batches = getAllBatches();
  const index = batches.findIndex((b) => b.id === batch.id);
  if (index >= 0) {
    batches[index] = batch;
  } else {
    batches.unshift(batch); // newest first
  }
  saveAllBatches(batches);
}

export function updateBatchItem(
  batchId: string,
  itemId: string,
  updater: (item: GenerationItem) => GenerationItem
): Batch | undefined {
  const batches = getAllBatches();
  const batch = batches.find((b) => b.id === batchId);
  if (!batch) return undefined;

  const itemIndex = batch.items.findIndex((i) => i.id === itemId);
  if (itemIndex < 0) return undefined;

  batch.items[itemIndex] = updater(batch.items[itemIndex]);

  // Recalculate completed items count & status
  const completedCount = batch.items.filter(
    (i) => i.status === 'success' || i.status === 'failed'
  ).length;

  batch.completedItems = completedCount;
  if (completedCount >= batch.totalItems) {
    batch.status = 'completed';
  } else {
    batch.status = 'processing';
  }

  saveAllBatches(batches);
  return batch;
}

export function deleteBatch(batchId: string): boolean {
  const batches = getAllBatches();
  const filtered = batches.filter((b) => b.id !== batchId);
  if (filtered.length !== batches.length) {
    saveAllBatches(filtered);
    return true;
  }
  return false;
}

/**
 * Cleanup batches older than 30 days according to PRD section 11.2 retention policy.
 */
export function cleanupOldBatches(): number {
  const batches = getAllBatches();
  const now = Date.now();
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const validBatches = batches.filter((b) => {
    const createdAt = new Date(b.createdAt).getTime();
    return createdAt >= cutoff;
  });

  const removedCount = batches.length - validBatches.length;
  if (removedCount > 0) {
    console.log(`[Retention Cleanup] Removed ${removedCount} batches older than ${RETENTION_DAYS} days.`);
    saveAllBatches(validBatches);
  }
  return removedCount;
}

// Run cleanup on module load
cleanupOldBatches();
