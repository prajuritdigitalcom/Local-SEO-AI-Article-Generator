import React, { useState, useEffect } from 'react';
import { X, Key, Check, Server, Shield, AlertTriangle, Save, Trash2 } from 'lucide-react';
import { ServerKeyStatus } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverKeyStatus: ServerKeyStatus | null;
  onKeysChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  serverKeyStatus,
  onKeysChanged,
}) => {
  const [userKeysInput, setUserKeysInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const localKey = localStorage.getItem('gemini_custom_api_keys') || '';
      const sessionKey = sessionStorage.getItem('gemini_custom_api_keys') || '';

      if (localKey) {
        setUserKeysInput(localKey);
      } else if (sessionKey) {
        setUserKeysInput(sessionKey);
      } else {
        setUserKeysInput('');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userKeysInput.trim();

    if (trimmed) {
      localStorage.setItem('gemini_custom_api_keys', trimmed);
      sessionStorage.removeItem('gemini_custom_api_keys');
    } else {
      localStorage.removeItem('gemini_custom_api_keys');
      sessionStorage.removeItem('gemini_custom_api_keys');
    }

    setSaveSuccess(true);
    onKeysChanged();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_custom_api_keys');
    sessionStorage.removeItem('gemini_custom_api_keys');
    setUserKeysInput('');
    onKeysChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 space-y-0">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-white">Pengaturan API Key Gemini</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Server Key Status Box */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>Status API Key Server (Environment Variable)</span>
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  serverKeyStatus?.hasServerKey
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                }`}
              >
                {serverKeyStatus?.hasServerKey ? 'Tersedia' : 'Belum Dikonfigurasi'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {serverKeyStatus?.hasServerKey
                ? `Server terkonfigurasi dengan ${serverKeyStatus.activeKeys} API Key Gemini aktif. Aplikasi dapat berjalan tanpa perlu input key mandiri.`
                : 'Server belum memiliki GEMINI_API_KEY. Anda dapat memasukkan API Key mandiri di bawah ini.'}
            </p>
          </div>

          {/* Mode A: User Key Input */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                API Key Gemini Mandiri (Opsional)
              </label>
              <textarea
                rows={3}
                value={userKeysInput}
                onChange={(e) => setUserKeysInput(e.target.value)}
                placeholder="Masukkan 1 atau beberapa API key Gemini dipisah koma/baris baru: AIzaSy... \n(Sistem akan merotasi key secara otomatis jika kuota limit)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Default Storage Notice */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                API Key tersimpan otomatis secara default di browser (<code className="text-indigo-300">localStorage</code>) sehingga siap digunakan kembali kapan saja.
              </span>
            </div>

            {/* Security note */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 flex items-start space-x-2">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                API Key Anda dikirimkan hanya melalui request header ke server untuk pemanggilan Gemini API, dan <strong>TIDAK PERNAH disimpan di database server</strong>.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={!userKeysInput}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Key Mandiri</span>
              </button>

              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
