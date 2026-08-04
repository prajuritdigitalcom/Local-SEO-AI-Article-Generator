import React, { useState, useEffect } from 'react';
import { Key, Server, Shield, Check, Save, Trash2, AlertCircle } from 'lucide-react';
import { ServerKeyStatus } from '../types';

interface SettingsViewProps {
  serverKeyStatus: ServerKeyStatus | null;
  onKeysChanged: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  serverKeyStatus,
  onKeysChanged,
}) => {
  const [userKeysInput, setUserKeysInput] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const sessionKey = sessionStorage.getItem('gemini_custom_api_keys') || '';
    const localKey = localStorage.getItem('gemini_custom_api_keys') || '';

    if (localKey) {
      setUserKeysInput(localKey);
      setRememberKey(true);
    } else if (sessionKey) {
      setUserKeysInput(sessionKey);
      setRememberKey(false);
    } else {
      setUserKeysInput('');
      setRememberKey(false);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userKeysInput.trim();

    if (trimmed) {
      if (rememberKey) {
        localStorage.setItem('gemini_custom_api_keys', trimmed);
        sessionStorage.removeItem('gemini_custom_api_keys');
      } else {
        sessionStorage.setItem('gemini_custom_api_keys', trimmed);
        localStorage.removeItem('gemini_custom_api_keys');
      }
    } else {
      sessionStorage.removeItem('gemini_custom_api_keys');
      localStorage.removeItem('gemini_custom_api_keys');
    }

    setSaveSuccess(true);
    onKeysChanged();
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  const handleClear = () => {
    sessionStorage.removeItem('gemini_custom_api_keys');
    localStorage.removeItem('gemini_custom_api_keys');
    setUserKeysInput('');
    onKeysChanged();
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8 text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-2">
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white uppercase tracking-wider"
            style={{ backgroundColor: '#fe4c6f' }}
          >
            Menu Setting
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan API Keys Gemini
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola API Key Gemini yang digunakan untuk meng-generate artikel Local SEO secara otomatis.
        </p>
      </div>

      {/* Server Status Info Card */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Status Server Environment Variable
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              serverKeyStatus?.hasServerKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {serverKeyStatus?.hasServerKey ? 'Key Server Aktif' : 'Belum Ada Key Server'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {serverKeyStatus?.hasServerKey
            ? `Server terkonfigurasi dengan ${serverKeyStatus.activeKeys} API Key Gemini aktif. Pemanggilan dapat berjalan otomatis tanpa input mandiri.`
            : 'Server belum memiliki GEMINI_API_KEY terpasang. Anda disarankan menginput API Key Gemini mandiri di bawah ini.'}
        </p>
      </div>

      {/* Custom User Key Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900">
            API Key Gemini Mandiri
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              (Bisa diisi 1 atau beberapa key dipisah koma / baris baru untuk rotasi otomatis kuota limit)
            </span>
          </label>
          <textarea
            rows={4}
            value={userKeysInput}
            onChange={(e) => setUserKeysInput(e.target.value)}
            placeholder={`AIzaSyA... \nAIzaSyB... \n\n(Rotasi otomatis akan berjalan jika salah satu key mencapai limit 429)`}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe4c6f]/30 focus:border-[#fe4c6f] transition-all"
          />
        </div>

        {/* Remember Checkbox */}
        <div className="flex items-start space-x-2.5 pt-1">
          <input
            type="checkbox"
            id="rememberKey"
            checked={rememberKey}
            onChange={(e) => setRememberKey(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-[#fe4c6f] focus:ring-[#fe4c6f]"
          />
          <label htmlFor="rememberKey" className="text-xs text-slate-700 cursor-pointer">
            Ingat key ini di browser ini (Simpan di <code className="font-mono text-slate-800 font-semibold bg-slate-100 px-1 py-0.5 rounded">localStorage</code>)
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Jika tidak dicentang, key disimpan sementara di <code className="font-mono">sessionStorage</code> dan terhapus saat tab ditutup.
            </span>
          </label>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start space-x-3">
          <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            API Key Anda hanya digunakan untuk request header ke Gemini API dan <strong>TIDAK PERNAH disimpan permanen di database server</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClear}
            disabled={!userKeysInput}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Key Mandiri</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 text-xs font-extrabold text-white rounded-xl shadow-md transition-all hover:opacity-95"
            style={{ backgroundColor: '#fe4c6f' }}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Pengaturan Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Key</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
