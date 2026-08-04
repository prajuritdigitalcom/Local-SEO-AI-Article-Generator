import { Batch, CreateBatchInput, ServerKeyStatus } from '../types';

function getCustomApiKeyHeader(): Record<string, string> {
  const rawKey =
    sessionStorage.getItem('gemini_custom_api_keys') ||
    localStorage.getItem('gemini_custom_api_keys') ||
    '';
  if (!rawKey) return {};

  // Split by newline or comma, trim spaces, and join into a clean single string
  const cleanKeys = rawKey
    .split(/[\n\r,]+/)
    .map((k) => k.trim())
    .filter(Boolean)
    .join(',');

  if (cleanKeys) {
    // encodeURIComponent prevents HTTP header invalid value errors in browser fetch()
    return { 'X-User-Gemini-Key': encodeURIComponent(cleanKeys) };
  }
  return {};
}

export async function getServerKeyStatus(): Promise<ServerKeyStatus> {
  try {
    const res = await fetch('/api/settings/keys');
    if (!res.ok) {
      throw new Error('Gagal mengambil status API Key server');
    }
    return res.json();
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

    const data = await res.json();
    if (!res.ok) {
      console.error('[Vercel/Log] createBatch failed:', data);
      throw new Error(data.error || 'Gagal membuat batch generate artikel.');
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
    if (!res.ok) {
      throw new Error('Batch tidak ditemukan.');
    }
    return res.json();
  } catch (err) {
    console.error(`[Vercel/Log] fetchBatch exception for batch ${batchId}:`, err);
    throw err;
  }
}

export async function fetchRecentBatches(): Promise<any[]> {
  try {
    const res = await fetch('/api/batches');
    if (!res.ok) {
      throw new Error('Gagal mengambil daftar batch.');
    }
    return res.json();
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
    if (!res.ok) {
      throw new Error('Gagal menghapus batch.');
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

    if (!res.ok) {
      const data = await res.json();
      console.error('[Vercel/Log] retryItem error:', data);
      throw new Error(data.error || 'Gagal memproses ulang item.');
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

    if (!res.ok) {
      const data = await res.json();
      console.error('[Vercel/Log] regenerateItem error:', data);
      throw new Error(data.error || 'Gagal meng-generate ulang artikel.');
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

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Gagal menyimpan perubahan artikel.');
  }

  return res.json();
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
