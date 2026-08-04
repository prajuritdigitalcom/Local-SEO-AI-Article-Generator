import React, { useState } from 'react';
import {
  Copy,
  Download,
  FileSpreadsheet,
  Check,
  RefreshCw,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Dices,
} from 'lucide-react';
import { Batch } from '../types';
import { exportToCSV, exportToExcel } from '../lib/exportUtils';

interface BatchProgressHeaderProps {
  batch: Batch;
  onNewBatch: () => void;
}

export const BatchProgressHeader: React.FC<BatchProgressHeaderProps> = ({
  batch,
  onNewBatch,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);

  const completedCount = batch.completedItems;
  const totalCount = batch.totalItems;
  const progressPercent = Math.round((completedCount / totalCount) * 100) || 0;

  const successItems = batch.items.filter((i) => i.status === 'success');
  const failedItems = batch.items.filter((i) => i.status === 'failed');
  const processingItems = batch.items.filter(
    (i) => i.status === 'processing' || i.status === 'pending'
  );

  const isCompleted = batch.status === 'completed' || completedCount >= totalCount;

  const handleCopyAll = () => {
    if (successItems.length === 0) return;

    const fullText = successItems
      .map((item, idx) => {
        return `=== ARTIKEL #${idx + 1}: ${item.keyword} ===\n\n${item.article}\n`;
      })
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 text-slate-800">
      {/* Top Info & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Batch #{batch.id.replace('b_', '').substring(0, 8)}
            </h2>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center space-x-1.5 ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Selesai ({completedCount}/{totalCount})</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>Memproses ({completedCount}/{totalCount})</span>
                </>
              )}
            </span>

            {batch.targetWordCount === 'random' ? (
              <span className="text-xs font-bold bg-rose-50 text-[#fe4c6f] border border-rose-200 px-2.5 py-1 rounded-full flex items-center space-x-1">
                <Dices className="w-3.5 h-3.5" />
                <span>Target: Random</span>
              </span>
            ) : (
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                Target: ~{batch.targetWordCount} Kata
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dibuat: {new Date(batch.createdAt).toLocaleString('id-ID')}
          </p>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy All */}
          <button
            onClick={handleCopyAll}
            disabled={successItems.length === 0}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              copiedAll
                ? 'bg-emerald-500 text-white border-emerald-500'
                : successItems.length > 0
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer'
                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
          >
            {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedAll ? 'Tersalin Semua!' : `Salin Semua (${successItems.length})`}</span>
          </button>

          {/* Download CSV */}
          <button
            onClick={() => exportToCSV(batch)}
            disabled={successItems.length === 0 && failedItems.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download CSV</span>
          </button>

          {/* Download Excel */}
          <button
            onClick={() => exportToExcel(batch)}
            disabled={successItems.length === 0 && failedItems.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
            <span>Download Excel</span>
          </button>

          {/* New Batch */}
          <button
            onClick={onNewBatch}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white transition-all shadow-xs cursor-pointer ml-auto"
            style={{ backgroundColor: '#fe4c6f' }}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Batch Baru</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Stats Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Kemajuan Batch</span>
          <span className="font-mono text-slate-900">{progressPercent}%</span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, backgroundColor: '#fe4c6f' }}
          />
        </div>

        {/* Counter Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Selesai</p>
              <p className="text-base font-extrabold text-slate-900 font-mono">{successItems.length}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <RefreshCw className={`w-4 h-4 ${processingItems.length > 0 ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Proses / Antre</p>
              <p className="text-base font-extrabold text-slate-900 font-mono">{processingItems.length}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Gagal</p>
              <p className="text-base font-extrabold text-slate-900 font-mono">{failedItems.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
