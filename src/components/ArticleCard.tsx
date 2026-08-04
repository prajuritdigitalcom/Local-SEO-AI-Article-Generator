import React, { useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Save,
  MapPin,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { GenerationItem } from '../types';

interface ArticleCardProps {
  item: GenerationItem;
  targetWordCount: number | 'random';
  itemNumber: number;
  onRetry: (itemId: string) => void;
  onRegenerate: (itemId: string) => void;
  onSaveEdit: (itemId: string, newArticle: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  item,
  targetWordCount,
  itemNumber,
  onRetry,
  onRegenerate,
  onSaveEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(item.article || '');

  const handleCopy = () => {
    if (!item.article) return;
    navigator.clipboard.writeText(item.article);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveEdit(item.id, editedText);
    setIsEditing(false);
  };

  const effectiveTarget = item.targetWordCount || (typeof targetWordCount === 'number' ? targetWordCount : 500);

  // Status Badge
  const getStatusBadge = () => {
    switch (item.status) {
      case 'success':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>Sedang Digenerate...</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Menunggu Antrean</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Gagal</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start space-x-3">
          <span
            className="flex-shrink-0 w-7 h-7 rounded-lg text-white text-xs font-extrabold font-mono flex items-center justify-center shadow-xs"
            style={{ backgroundColor: '#fe4c6f' }}
          >
            #{itemNumber}
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
              {item.keyword}
            </h3>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
              {/* Local Context Badge */}
              {item.localContextDetected !== null && (
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border ${
                    item.localContextDetected
                      ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title={
                    item.localContextDetected
                      ? 'Sistem mendeteksi kata kunci wilayah lokal.'
                      : 'Artikel berfokus umum tanpa nama wilayah spesifik.'
                  }
                >
                  <MapPin className="w-3 h-3" />
                  <span>Konteks Lokal: {item.localContextDetected ? 'Ya' : 'Tidak'}</span>
                </span>
              )}

              {/* Language Style */}
              {item.languageStyleUsed && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                  <BookOpen className="w-3 h-3 text-slate-500" />
                  <span>{item.languageStyleUsed}</span>
                </span>
              )}

              {/* Word Count */}
              {item.actualWordCount !== null && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200">
                  <span>
                    {item.actualWordCount} / {effectiveTarget} Kata
                  </span>
                </span>
              )}

              {/* Time */}
              {item.generationTimeMs !== null && (
                <span className="text-slate-400 font-mono">
                  ({(item.generationTimeMs / 1000).toFixed(1)}s)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="self-start sm:self-center">{getStatusBadge()}</div>
      </div>

      {/* States */}
      {item.status === 'processing' && (
        <div className="py-8 text-center space-y-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <RefreshCw className="w-8 h-8 text-[#fe4c6f] animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-800">
            Gemini AI sedang menulis artikel unik...
          </p>
          <p className="text-xs text-slate-500">
            Target ~{effectiveTarget} kata • Mengombinasikan variasi bahasa & alur narasi.
          </p>
        </div>
      )}

      {item.status === 'pending' && (
        <div className="py-6 text-center space-y-2 bg-slate-50/50 rounded-xl border border-slate-100">
          <Clock className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Menunggu giliran antrean...</p>
        </div>
      )}

      {item.status === 'failed' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 text-rose-800">
          <div className="flex items-start space-x-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Gagal Memproses Artikel</p>
              <p className="mt-0.5 text-slate-700">{item.errorReason || 'Terjadi kesalahan sistem.'}</p>
            </div>
          </div>
          <button
            onClick={() => onRetry(item.id)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Coba Lagi Baris Ini</span>
          </button>
        </div>
      )}

      {item.status === 'success' && item.article && (
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                rows={10}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe4c6f]/30 focus:border-[#fe4c6f]"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedText(item.article || '');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors"
                  style={{ backgroundColor: '#fe4c6f' }}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-800 leading-relaxed space-y-3 bg-slate-50/60 border border-slate-200/60 rounded-xl p-4 sm:p-5">
              {item.article.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx} className="m-0">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Tersalin!' : 'Copy Artikel'}</span>
              </button>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Manual</span>
                </button>
              )}
            </div>

            <button
              onClick={() => onRegenerate(item.id)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-[#fe4c6f] border border-rose-200 transition-colors cursor-pointer"
              title="Generate ulang artikel ini"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#fe4c6f]" />
              <span>Regenerate (Variasi Baru)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
