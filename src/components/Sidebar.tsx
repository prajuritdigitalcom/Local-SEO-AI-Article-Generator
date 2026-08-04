import React from 'react';
import {
  Wand2,
  History,
  Settings,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  Key,
  PlusCircle,
} from 'lucide-react';
import { ServerKeyStatus } from '../types';

export type TabType = 'generate' | 'riwayat' | 'setting' | 'panduan';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  keyStatus: ServerKeyStatus | null;
  hasUserKeys: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onNewBatchRequest?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  keyStatus,
  hasUserKeys,
  mobileOpen,
  setMobileOpen,
  onNewBatchRequest,
}) => {
  const menuItems = [
    {
      id: 'generate' as TabType,
      label: 'Generate',
      description: 'Input & Generate Artikel',
      icon: Wand2,
    },
    {
      id: 'riwayat' as TabType,
      label: 'Riwayat',
      description: 'Daftar Hasil Batch',
      icon: History,
    },
    {
      id: 'setting' as TabType,
      label: 'Setting',
      description: 'Pengaturan API Keys',
      icon: Settings,
    },
  ];

  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shadow-[#fe4c6f]/20"
                style={{ backgroundColor: '#fe4c6f' }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight tracking-tight">
                  Local SEO <span style={{ color: '#fe4c6f' }}>AI</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Article Generator</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Batch Action Button if on generate view */}
          {onNewBatchRequest && (
            <div className="p-4">
              <button
                onClick={() => {
                  onNewBatchRequest();
                  setActiveTab('generate');
                  setMobileOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#fe4c6f]/20 hover:opacity-95"
                style={{ backgroundColor: '#fe4c6f' }}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Batch Baru</span>
              </button>
            </div>
          )}

          {/* Main Menu Links */}
          <nav className="p-4 space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu Utama
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left group ${
                    isActive
                      ? 'bg-rose-50 border border-rose-100 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={isActive ? { color: '#fe4c6f' } : undefined}
                >
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-white shadow-xs' : 'bg-slate-100 group-hover:bg-slate-200/70 text-slate-500'
                    }`}
                    style={isActive ? { color: '#fe4c6f' } : undefined}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold leading-none">{item.label}</span>
                    <span className="block text-[10px] font-normal text-slate-400 mt-1">
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status & Guidelines */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          {/* Panduan Button */}
          <button
            onClick={() => handleNavClick('panduan')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeTab === 'panduan'
                ? 'bg-white border-slate-300 text-slate-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Panduan Local SEO</span>
          </button>

          {/* API Key Status Widget */}
          <div
            onClick={() => handleNavClick('setting')}
            className="p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                <Key className="w-3 h-3 text-slate-400" />
                <span>API Key Gemini</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  hasUserKeys || keyStatus?.hasServerKey ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
            <p className="text-xs font-bold text-slate-800">
              {hasUserKeys
                ? 'Key Mandiri Aktif'
                : keyStatus?.hasServerKey
                ? `Key Server (${keyStatus.activeKeys} Key)`
                : 'Belum Terpasang'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
