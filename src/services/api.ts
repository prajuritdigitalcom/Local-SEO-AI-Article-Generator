import { Batch, CreateBatchInput, ServerKeyStatus } from '../types';

function getCustomApiKeyHeader(): Record<string, string> {
  const key = sessionStorage.getItem('gemini_custom_api_keys') || localStorage.getItem('gemini_custom_api_keys') || '';
  if (key) {
    return { 'X-User-Gemini-Key': key };
  }
  return {};
}

export async function getServerKeyStatus(): Promise<ServerKeyStatus> {
  const res = await fetch('/api/settings/keys');
  if (!res.ok) {
    throw new Error('Gagal mengambil status API Key server');
  }
  return res.json();
}

export async function createBatch(input: CreateBatchInput): Promise<{ batchId: string; totalItems: number }> {
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
    throw new Error(data.error || 'Gagal membuat batch generate artikel.');
  }

  return data;
}

export async function fetchBatch(batchId: string): Promise<Batch> {
  const res = await fetch(`/api/batch/${batchId}`);
  if (!res.ok) {
    throw new Error('Batch tidak ditemukan.');
  }
  return res.json();
}

export async function fetchRecentBatches(): Promise<any[]> {
  const res = await fetch('/api/batches');
  if (!res.ok) {
    throw new Error('Gagal mengambil daftar batch.');
  }
  return res.json();
}

export async function deleteBatch(batchId: string): Promise<void> {
  const res = await fetch(`/api/batch/${batchId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Gagal menghapus batch.');
  }
}

export async function retryItem(batchId: string, itemId: string): Promise<void> {
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
    throw new Error(data.error || 'Gagal memproses ulang item.');
  }
}

export async function regenerateItem(batchId: string, itemId: string): Promise<void> {
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
    throw new Error(data.error || 'Gagal meng-generate ulang artikel.');
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
