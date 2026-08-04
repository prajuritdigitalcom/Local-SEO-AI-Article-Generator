import React, { useState, useEffect } from 'react';
import { X, History, Trash2, ExternalLink, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { fetchRecentBatches, deleteBatch } from '../services/api';

interface BatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBatch: (batchId: string) => void;
  currentBatchId?: string;
}

export const BatchHistoryModal: React.FC<BatchHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectBatch,
  currentBatchId,
}) => {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await fetchRecentBatches();
      setBatches(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBatches();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent, batchId: string) => {
    e.stopPropagation();
    if (confirm('Hapus batch ini dari riwayat?')) {
      await deleteBatch(batchId);
      loadBatches();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 space-y-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Riwayat Batch Generate</h3>
              <p className="text-xs text-slate-400">Daftar batch tersimpan (Retensi Otomatis 30 Hari)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Memuat riwayat batch...</div>
          ) : batches.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">Belum ada riwayat batch tersimpan.</p>
            </div>
          ) : (
            batches.map((b) => {
              const isCurrent = b.id === currentBatchId;
              const shortId = b.id.replace('b_', '').substring(0, 8);
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    onSelectBatch(b.id);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-indigo-950/50 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white font-mono">#{shortId}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          b.status === 'completed'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                            : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {b.completedItems}/{b.totalItems} Artikel
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold bg-indigo-500 text-white px-2 py-0.5 rounded">
                          Sedang Dibuka
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(b.createdAt).toLocaleString('id-ID')}</span>
                    </p>

                    {b.keywordsSample && b.keywordsSample.length > 0 && (
                      <p className="text-xs text-slate-300 line-clamp-1 italic">
                        "{b.keywordsSample.join(', ')}..."
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDelete(e, b.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Hapus batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
