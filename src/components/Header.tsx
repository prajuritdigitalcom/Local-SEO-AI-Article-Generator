import React from 'react';
import { Sparkles, Key, History, HelpCircle, FileText } from 'lucide-react';
import { ServerKeyStatus } from '../types';

interface HeaderProps {
  keyStatus: ServerKeyStatus | null;
  hasUserKeys: boolean;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenGuidelines: () => void;
  onNewBatch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  keyStatus,
  hasUserKeys,
  onOpenSettings,
  onOpenHistory,
  onOpenGuidelines,
  onNewBatch,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNewBatch}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                AI Local SEO Generator
              </h1>
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                v1.1
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Generator Artikel Unik per Kata Kunci & Wilayah
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* API Key Status Indicator */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasUserKeys
                ? 'bg-purple-950/50 border-purple-500/40 text-purple-300 hover:bg-purple-900/50'
                : keyStatus?.hasServerKey
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
            }`}
            title="Pengaturan API Key Gemini"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {hasUserKeys
                ? 'Key Mandiri'
                : keyStatus?.hasServerKey
                ? `Key Server (${keyStatus.activeKeys} Aktif)`
                : 'Belum ada API Key'}
            </span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Riwayat Batch"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Riwayat Batch</span>
          </button>

          {/* Guidelines / Panduan Button */}
          <button
            onClick={onOpenGuidelines}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Panduan Local SEO & AI"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Panduan</span>
          </button>

          {/* New Batch Button */}
          {onNewBatch && (
            <button
              onClick={onNewBatch}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Form Baru</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
