import React, { useState, useEffect } from 'react';
import { History, Trash2, ExternalLink, Calendar, Search, RefreshCw, FileText } from 'lucide-react';
import { fetchRecentBatches, deleteBatch } from '../services/api';

interface HistoryViewProps {
  onSelectBatch: (batchId: string) => void;
  currentBatchId?: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onSelectBatch,
  currentBatchId,
}) => {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    loadBatches();
  }, []);

  const handleDelete = async (e: React.MouseEvent, batchId: string) => {
    e.stopPropagation();
    if (confirm('Hapus batch ini dari riwayat tersimpan?')) {
      await deleteBatch(batchId);
      loadBatches();
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const shortId = b.id.toLowerCase();
    const sampleText = (b.keywordsSample || []).join(' ').toLowerCase();
    return shortId.includes(q) || sampleText.includes(q);
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white uppercase tracking-wider"
              style={{ backgroundColor: '#fe4c6f' }}
            >
              Menu Riwayat
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Riwayat Batch Generate Artikel
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar batch artikel SEO lokal tersimpan di server (Retensi otomatis 30 hari).
          </p>
        </div>

        <button
          onClick={loadBatches}
          disabled={loading}
          className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 transition-colors self-start md:self-auto flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan kata kunci / ID batch..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe4c6f]/30 focus:border-[#fe4c6f] transition-all"
        />
      </div>

      {/* Batch Cards List */}
      <div className="space-y-3 pt-2">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Memuat daftar riwayat batch...
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-500">
              Belum ada riwayat batch tersimpan.
            </p>
            <p className="text-xs text-slate-400">
              Setiap kali Anda men-generate artikel di Menu Generate, riwayat batch akan otomatis tercatat di sini.
            </p>
          </div>
        ) : (
          filteredBatches.map((b) => {
            const isCurrent = b.id === currentBatchId;
            const shortId = b.id.replace('b_', '').substring(0, 8);

            return (
              <div
                key={b.id}
                onClick={() => onSelectBatch(b.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-rose-50/40 border-rose-200 ring-1 ring-[#fe4c6f]/30'
                    : 'bg-slate-50/40 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 font-mono">
                      #{shortId}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        b.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {b.completedItems}/{b.totalItems} Artikel Selesai
                    </span>

                    {b.targetWordCount === 'random' ? (
                      <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                        🎲 Target: Random
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                        Target: ~{b.targetWordCount} Kata
                      </span>
                    )}

                    {isCurrent && (
                      <span
                        className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#fe4c6f' }}
                      >
                        Sedang Dilihat
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(b.createdAt).toLocaleString('id-ID')}</span>
                  </p>

                  {b.keywordsSample && b.keywordsSample.length > 0 && (
                    <p className="text-xs text-slate-600 line-clamp-1 italic bg-white/80 p-2 rounded-lg border border-slate-100">
                      "{b.keywordsSample.join(', ')}..."
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={(e) => handleDelete(e, b.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectBatch(b.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs"
                    style={{ backgroundColor: '#fe4c6f' }}
                  >
                    <span>Buka Artikel</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
