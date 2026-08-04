import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { FormInputSection } from './components/FormInputSection';
import { BatchProgressHeader } from './components/BatchProgressHeader';
import { ArticleCard } from './components/ArticleCard';
import { SettingsView } from './components/SettingsView';
import { HistoryView } from './components/HistoryView';
import { GuidelinesModal } from './components/GuidelinesModal';
import {
  getServerKeyStatus,
  createBatch,
  fetchBatch,
  subscribeToBatchStream,
  retryItem,
  regenerateItem,
  updateItemArticle,
} from './services/api';
import { Batch, CreateBatchInput, ServerKeyStatus } from './types';
import { Menu, Sparkles, AlertCircle, FileText, PlusCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [serverKeyStatus, setServerKeyStatus] = useState<ServerKeyStatus | null>(null);
  const [hasUserKeys, setHasUserKeys] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  const streamUnsubscribeRef = useRef<(() => void) | null>(null);

  // Check key availability on load & when keys change
  const checkKeyStatus = async () => {
    try {
      const status = await getServerKeyStatus();
      setServerKeyStatus(status);
    } catch (err) {
      console.error('Failed to get server key status:', err);
    }

    const userKey =
      sessionStorage.getItem('gemini_custom_api_keys') ||
      localStorage.getItem('gemini_custom_api_keys') ||
      '';
    setHasUserKeys(Boolean(userKey.trim()));
  };

  useEffect(() => {
    checkKeyStatus();
  }, []);

  // Cleanup SSE stream on unmount
  useEffect(() => {
    return () => {
      if (streamUnsubscribeRef.current) {
        streamUnsubscribeRef.current();
        streamUnsubscribeRef.current = null;
      }
    };
  }, []);

  const handleSubscribeToBatch = (batchId: string) => {
    if (streamUnsubscribeRef.current) {
      streamUnsubscribeRef.current();
      streamUnsubscribeRef.current = null;
    }

    const unsubscribe = subscribeToBatchStream(
      batchId,
      (updatedBatch) => {
        setCurrentBatch(updatedBatch);
      },
      (err) => {
        console.warn('SSE Stream Notice:', err);
      }
    );

    streamUnsubscribeRef.current = unsubscribe;
  };

  const handleCreateBatch = async (input: CreateBatchInput) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { batchId } = await createBatch(input);
      const initialBatch = await fetchBatch(batchId);
      setCurrentBatch(initialBatch);

      // Start SSE stream for realtime live progress
      handleSubscribeToBatch(batchId);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal membuat batch generate artikel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectBatchFromHistory = async (batchId: string) => {
    try {
      const batch = await fetchBatch(batchId);
      setCurrentBatch(batch);
      handleSubscribeToBatch(batchId);
      setActiveTab('generate');
    } catch (err: any) {
      setErrorMsg('Gagal memuat batch dari riwayat.');
    }
  };

  const handleRetryItem = async (itemId: string) => {
    if (!currentBatch) return;
    try {
      await retryItem(currentBatch.id, itemId);
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses ulang item.');
    }
  };

  const handleRegenerateItem = async (itemId: string) => {
    if (!currentBatch) return;
    try {
      await regenerateItem(currentBatch.id, itemId);
    } catch (err: any) {
      alert(err?.message || 'Gagal meng-generate ulang artikel.');
    }
  };

  const handleSaveItemEdit = async (itemId: string, newArticle: string) => {
    if (!currentBatch) return;
    try {
      const updated = await updateItemArticle(currentBatch.id, itemId, newArticle);
      setCurrentBatch(updated);
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan artikel.');
    }
  };

  const handleNewBatch = () => {
    if (streamUnsubscribeRef.current) {
      streamUnsubscribeRef.current();
      streamUnsubscribeRef.current = null;
    }
    setCurrentBatch(null);
    setErrorMsg(null);
    setActiveTab('generate');
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === 'panduan') {
      setIsGuidelinesOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const effectiveHasKey = Boolean(hasUserKeys || serverKeyStatus?.hasServerKey);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-[#fe4c6f]/20 selection:text-[#fe4c6f]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        keyStatus={serverKeyStatus}
        hasUserKeys={hasUserKeys}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onNewBatchRequest={currentBatch ? handleNewBatch : undefined}
      />

      {/* Main Content Area Offset for Sidebar */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Mobile Top Navbar Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div
              className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs"
              style={{ backgroundColor: '#fe4c6f' }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">
              Local SEO <span style={{ color: '#fe4c6f' }}>AI</span>
            </span>
          </div>

          {currentBatch && (
            <button
              onClick={handleNewBatch}
              className="p-1.5 rounded-lg text-white text-xs font-bold flex items-center space-x-1"
              style={{ backgroundColor: '#fe4c6f' }}
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
        </header>

        {/* Body Container */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Global Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-3 shadow-xs animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">Terjadi Kesalahan</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-500 hover:text-rose-800 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: MENU GENERATE */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              {!currentBatch ? (
                <FormInputSection
                  onSubmit={handleCreateBatch}
                  isSubmitting={isSubmitting}
                  hasApiKey={effectiveHasKey}
                />
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <BatchProgressHeader batch={currentBatch} onNewBatch={handleNewBatch} />

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-[#fe4c6f]" />
                        <span>Daftar Artikel ({currentBatch.items.length})</span>
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        Realtime SSE Stream
                      </span>
                    </div>

                    <div className="space-y-6">
                      {currentBatch.items.map((item, idx) => (
                        <ArticleCard
                          key={item.id}
                          item={item}
                          targetWordCount={currentBatch.targetWordCount}
                          itemNumber={idx + 1}
                          onRetry={handleRetryItem}
                          onRegenerate={handleRegenerateItem}
                          onSaveEdit={handleSaveItemEdit}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MENU RIWAYAT */}
          {activeTab === 'riwayat' && (
            <HistoryView
              onSelectBatch={handleSelectBatchFromHistory}
              currentBatchId={currentBatch?.id}
            />
          )}

          {/* TAB 3: MENU SETTING */}
          {activeTab === 'setting' && (
            <SettingsView
              serverKeyStatus={serverKeyStatus}
              onKeysChanged={checkKeyStatus}
            />
          )}
        </main>
      </div>

      {/* Guidelines Modal */}
      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
}
