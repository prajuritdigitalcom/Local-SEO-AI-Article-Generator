import { Batch, CreateBatchInput, ServerKeyStatus } from '../types';

/**
 * Parse Response fetch() sebagai JSON secara aman.
 *
 * Jika server (atau proxy/CDN di depannya) mengembalikan sesuatu yang bukan
 * JSON — halaman error HTML, teks "Not Found", body kosong, dsb — res.json()
 * akan melempar error mentah seperti:
 *   Unexpected token 'T', "The page c"... is not valid JSON
 * Fungsi ini membaca body sebagai teks dulu, dan jika bukan JSON valid,
 * melempar error yang jelas dan actionable (termasuk status HTTP-nya).
 */
async function safeParseResponse(res: Response): Promise<any> {
  const rawText = await res.text();

  if (!rawText) {
    if (res.ok) return {};
    throw new Error(`Server mengembalikan respons kosong (HTTP ${res.status}).`);
  }

  try {
    return JSON.parse(rawText);
  } catch {
    console.error(
      `[Vercel/Log] Non-JSON response (HTTP ${res.status}) from ${res.url}:`,
      rawText.slice(0, 300)
    );
    throw new Error(
      `Server mengembalikan respons yang tidak valid (HTTP ${res.status}). ` +
        'Kemungkinan endpoint API tidak ditemukan atau server backend belum berjalan dengan benar. ' +
        'Coba muat ulang halaman; jika masih terjadi, periksa log server / konfigurasi deployment.'
    );
  }
}

function getCustomApiKeyHeader(): Record<string, string> {
  const rawKey =
    sessionStorage.getItem('gemini_custom_api_keys') ||
    localStorage.getItem('gemini_custom_api_keys') ||
    '';
  if (!rawKey) return {};

  // Extract clean valid API key strings (only valid ASCII letters, numbers, hyphens, underscores)
  const cleanKeys = rawKey
    .split(/[\n\r,]+/)
    .map((k) => k.replace(/[^a-zA-Z0-9\-_]/g, '').trim())
    .filter(Boolean)
    .join(',');

  if (cleanKeys) {
    return { 'X-User-Gemini-Key': cleanKeys };
  }
  return {};
}

export async function getServerKeyStatus(): Promise<ServerKeyStatus> {
  try {
    const res = await fetch('/api/settings/keys');
    const data = await safeParseResponse(res);
    if (!res.ok) {
      throw new Error(data?.error || 'Gagal mengambil status API Key server');
    }
    return data;
  } catch (err) {
    console.error('[Vercel/Log] Error fetching server key status:', err);
    throw err;
  }
}

export async function createBatch(input: CreateBatchInput): Promise<{ batchId: string; totalItems: number }> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getCustomApiKeyHeader(),
    };

    const res = await fetch('/api/batch/create', {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    const data = await safeParseResponse(res);
    if (!res.ok) {
      console.error('[Vercel/Log] createBatch failed:', data);
      throw new Error(data?.error || 'Gagal membuat batch generate artikel.');
    }

    return data;
  } catch (err: any) {
    console.error('[Vercel/Log] createBatch exception:', err);
    throw err;
  }
}

export async function fetchBatch(batchId: string): Promise<Batch> {
  try {
    const res = await fetch(`/api/batch/${batchId}`);
    const data = await safeParseResponse(res);
    if (!res.ok) {
      throw new Error(data?.error || 'Batch tidak ditemukan.');
    }
    return data;
  } catch (err) {
    console.error(`[Vercel/Log] fetchBatch exception for batch ${batchId}:`, err);
    throw err;
  }
}

export async function fetchRecentBatches(): Promise<any[]> {
  try {
    const res = await fetch('/api/batches');
    const data = await safeParseResponse(res);
    if (!res.ok) {
      throw new Error(data?.error || 'Gagal mengambil daftar batch.');
    }
    return data;
  } catch (err) {
    console.error('[Vercel/Log] fetchRecentBatches exception:', err);
    throw err;
  }
}

export async function deleteBatch(batchId: string): Promise<void> {
  try {
    const res = await fetch(`/api/batch/${batchId}`, {
      method: 'DELETE',
    });
    const data = await safeParseResponse(res);
    if (!res.ok) {
      throw new Error(data?.error || 'Gagal menghapus batch.');
    }
  } catch (err) {
    console.error(`[Vercel/Log] deleteBatch exception for ${batchId}:`, err);
    throw err;
  }
}

export async function retryItem(batchId: string, itemId: string): Promise<void> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getCustomApiKeyHeader(),
    };

    const res = await fetch(`/api/batch/${batchId}/retry/${itemId}`, {
      method: 'POST',
      headers,
    });

    const data = await safeParseResponse(res);
    if (!res.ok) {
      console.error('[Vercel/Log] retryItem error:', data);
      throw new Error(data?.error || 'Gagal memproses ulang item.');
    }
  } catch (err) {
    console.error(`[Vercel/Log] retryItem exception for item ${itemId}:`, err);
    throw err;
  }
}

export async function regenerateItem(batchId: string, itemId: string): Promise<void> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getCustomApiKeyHeader(),
    };

    const res = await fetch(`/api/batch/${batchId}/regenerate/${itemId}`, {
      method: 'POST',
      headers,
    });

    const data = await safeParseResponse(res);
    if (!res.ok) {
      console.error('[Vercel/Log] regenerateItem error:', data);
      throw new Error(data?.error || 'Gagal meng-generate ulang artikel.');
    }
  } catch (err) {
    console.error(`[Vercel/Log] regenerateItem exception for item ${itemId}:`, err);
    throw err;
  }
}

export async function updateItemArticle(batchId: string, itemId: string, article: string): Promise<Batch> {
  const res = await fetch(`/api/batch/${batchId}/edit/${itemId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ article }),
  });

  const data = await safeParseResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Gagal menyimpan perubahan artikel.');
  }

  return data;
}

export function subscribeToBatchStream(
  batchId: string,
  onUpdate: (batch: Batch) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`/api/batch/${batchId}/stream`);

  eventSource.onmessage = (e) => {
    try {
      const batch: Batch = JSON.parse(e.data);
      onUpdate(batch);
    } catch (err) {
      console.error('Error parsing SSE data:', err);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}
