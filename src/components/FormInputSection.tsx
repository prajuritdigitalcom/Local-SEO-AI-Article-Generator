import React, { useState, useMemo } from 'react';
import { Sparkles, Info, AlertTriangle, CheckCircle2, Sliders, Dices } from 'lucide-react';
import { CreateBatchInput, LanguageStyle } from '../types';

interface FormInputSectionProps {
  onSubmit: (input: CreateBatchInput) => void;
  isSubmitting: boolean;
  hasApiKey: boolean;
}

const SAMPLE_KEYWORDS = `Jasa Terapi Bekam Jakarta Barat
Jasa Terapi Bekam Jakarta Timur
Terapi Bekam Panggilan ke Rumah
Jasa Bekam Depok Dekat Margonda
Jasa Terapi Bekam Bekasi Selatan
Layanan Bekam Steril Tangerang
Terapi Bekam Sunnah Bogor`;

const SAMPLE_REF_INFO = `Bekam Sehat adalah pusat terapi bekam sunnah & medis profesional dengan terapis bersertifikat resmi PBI (Perkumpulan Bekam Indonesia). 

Keunggulan Layanan:
1. Peralatan 100% steril & jarum disposabel sekali pakai untuk menjamin higienitas maksimal.
2. Melayani panggilan langsung ke rumah / kantor untuk kenyamanan pasien.
3. Bebas konsultasi kesehatan gratis sebelum & sesudah terapi.
4. Tarif terjangkau transparan tanpa biaya tersembunyi.
5. Menangani pegal linu, kolesterol tinggi, asam urat, migrain, hipertensi, dan relaksasi tubuh.`;

export const FormInputSection: React.FC<FormInputSectionProps> = ({
  onSubmit,
  isSubmitting,
  hasApiKey,
}) => {
  const [keywordsText, setKeywordsText] = useState(SAMPLE_KEYWORDS);
  const [referenceInfo, setReferenceInfo] = useState(SAMPLE_REF_INFO);
  const [languageStyle, setLanguageStyle] = useState<LanguageStyle>('acak');
  const [targetWordCount, setTargetWordCount] = useState<number | 'random'>('random');

  // Parse keywords
  const parsedKeywords = useMemo(() => {
    return keywordsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [keywordsText]);

  // Valid lines check
  const validKeywords = useMemo(() => {
    return parsedKeywords.filter((k) => k.length >= 3 && k.length <= 150);
  }, [parsedKeywords]);

  const invalidLines = useMemo(() => {
    const invalid: { lineNum: number; text: string; reason: string }[] = [];
    const lines = keywordsText.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        if (trimmed.length < 3) {
          invalid.push({ lineNum: idx + 1, text: trimmed, reason: 'Kurang dari 3 karakter' });
        } else if (trimmed.length > 150) {
          invalid.push({ lineNum: idx + 1, text: trimmed, reason: 'Lebih dari 150 karakter' });
        }
      }
    });
    return invalid;
  }, [keywordsText]);

  const isExceedingMaxLimit = validKeywords.length > 50;
  const isRefInfoValid = referenceInfo.trim().length >= 20 && referenceInfo.length <= 3000;
  const isFormValid = validKeywords.length > 0 && !isExceedingMaxLimit && isRefInfoValid && hasApiKey;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    onSubmit({
      keywords: validKeywords,
      referenceInfo: referenceInfo.trim(),
      languageStyle,
      targetWordCount,
    });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8 text-slate-800">
      {/* Header Banner */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white uppercase tracking-wider"
              style={{ backgroundColor: '#fe4c6f' }}
            >
              Menu Generate
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Form Request Local SEO Artikel
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate puluhan artikel SEO lokal unik secara masal dengan optimasi kata kunci & wilayah otomatis.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setKeywordsText(SAMPLE_KEYWORDS);
            setReferenceInfo(SAMPLE_REF_INFO);
          }}
          className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 transition-colors self-start md:self-auto flex items-center space-x-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Muat Contoh Data</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Field 1: Kata Kunci Target */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="block text-sm font-bold text-slate-900">
              Kata Kunci Target <span style={{ color: '#fe4c6f' }}>*</span>
              <span className="text-xs font-normal text-slate-500 ml-1.5">
                (1 baris = 1 artikel. Bisa berupa keyword lokal/wilayah atau umum)
              </span>
            </label>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isExceedingMaxLimit
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : validKeywords.length > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {validKeywords.length} / 50 Kata Kunci Valid
            </span>
          </div>

          <textarea
            rows={7}
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            placeholder={`Masukkan daftar kata kunci target, satu per baris:\nJasa Terapi Bekam Jakarta Barat\nJasa Terapi Bekam Jakarta Timur\nTerapi Bekam Panggilan ke Rumah\nJasa Bekam Depok Dekat Margonda`}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe4c6f]/30 focus:border-[#fe4c6f] font-mono transition-all leading-relaxed"
          />

          {/* Warning for invalid lines */}
          {invalidLines.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Ada baris yang akan diabaikan karena kurang/terlalu panjang:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                {invalidLines.slice(0, 3).map((inv, idx) => (
                  <li key={idx}>
                    Baris #{inv.lineNum}: "{inv.text}" ({inv.reason})
                  </li>
                ))}
                {invalidLines.length > 3 && (
                  <li>...dan {invalidLines.length - 3} baris lainnya.</li>
                )}
              </ul>
            </div>
          )}

          {isExceedingMaxLimit && (
            <p className="text-xs text-rose-600 font-semibold flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Jumlah kata kunci melebihi batas maksimum 50 baris per batch.</span>
            </p>
          )}
        </div>

        {/* Field 2: Informasi Referensi */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              Informasi Referensi Layanan / Produk <span style={{ color: '#fe4c6f' }}>*</span>
              <span className="text-xs font-normal text-slate-500 ml-1.5">
                (Fakta & keunggulan yang konsisten di seluruh artikel)
              </span>
            </label>
            <span
              className={`text-xs font-mono font-semibold ${
                referenceInfo.length < 20
                  ? 'text-amber-600'
                  : referenceInfo.length > 3000
                  ? 'text-rose-600'
                  : 'text-slate-400'
              }`}
            >
              {referenceInfo.length} / 3000 Karakter
            </span>
          </div>

          <textarea
            rows={5}
            value={referenceInfo}
            onChange={(e) => setReferenceInfo(e.target.value)}
            placeholder="Tuliskan keunggulan layanan, kelebihan utama, garansi, atau fakta bisnis..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe4c6f]/30 focus:border-[#fe4c6f] transition-all leading-relaxed"
          />

          {referenceInfo.trim().length < 20 && referenceInfo.length > 0 && (
            <p className="text-xs text-amber-600 font-medium">
              Informasi referensi minimal 20 karakter agar AI tidak berhalusinasi.
            </p>
          )}
        </div>

        {/* Field 3 & 4 Grid: Gaya Bahasa & Dropdown Target Panjang Artikel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Gaya Bahasa */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              Gaya Bahasa / Tone & Style
            </label>
            <select
              value={languageStyle}
              onChange={(e) => setLanguageStyle(e.target.value as LanguageStyle)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe4c6f]/30 focus:border-[#fe4c6f] transition-all cursor-pointer"
            >
              <option value="acak">🎲 Acak / Rotasi Otomatis (Direkomendasikan Variasi Max)</option>
              <option value="formal-informatif">📘 Formal-Informatif (Edukatif & Profesional)</option>
              <option value="personal-storytelling">📖 Personal / Storytelling (Pembuka Cerita Warm)</option>
              <option value="to-the-point-persuasif">⚡ To-the-Point / Persuasif (Lugas & Urgensi)</option>
              <option value="konsultatif">💬 Konsultatif / Tanya-Jawab (Empatik & Solutif)</option>
            </select>
            <p className="text-xs text-slate-500">
              Pilihan "Acak" otomatis merotasi gaya bahasa pada tiap artikel dalam batch.
            </p>
          </div>

          {/* Target Panjang Artikel (Drop Down & Random) */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Target Panjang Artikel</span>
              {targetWordCount === 'random' && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white flex items-center space-x-1"
                  style={{ backgroundColor: '#fe4c6f' }}
                >
                  <Dices className="w-3 h-3" />
                  <span>Random per Artikel</span>
                </span>
              )}
            </label>

            <select
              value={targetWordCount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'random') {
                  setTargetWordCount('random');
                } else {
                  setTargetWordCount(Number(val));
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe4c6f]/30 focus:border-[#fe4c6f] transition-all cursor-pointer"
            >
              <option value="random">🎲 Random / Acak (Beda-beda per Artikel)</option>
              <option value="300">📄 ~300 Kata (Ringkas)</option>
              <option value="500">📑 ~500 Kata (Standar)</option>
              <option value="700">📚 ~700 Kata (Mendalam)</option>
              <option value="1000">📖 ~1000 Kata (Panjang / Komprehensif)</option>
            </select>

            <p className="text-xs text-slate-500">
              {targetWordCount === 'random'
                ? 'Setiap artikel di batch akan secara acak berdurasi 300 s/d 1000 kata agar tidak monoton.'
                : `Target sekitar ${targetWordCount} kata per artikel (toleransi ±15%).`}
            </p>
          </div>
        </div>

        {/* API Key Warning Alert if missing */}
        {!hasApiKey && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">API Key Gemini Belum Terkonfigurasi</p>
              <p className="mt-0.5 text-slate-600">
                Aplikasi belum memiliki API Key Gemini di server atau di browser. Buka menu{' '}
                <strong>Setting</strong> di sidebar untuk memasukkan API Key Gemini mandiri.
              </p>
            </div>
          </div>
        )}

        {/* Submit Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-extrabold text-base flex items-center justify-center space-x-2 transition-all shadow-md ${
              isFormValid && !isSubmitting
                ? 'text-white shadow-[#fe4c6f]/25 hover:opacity-95 cursor-pointer active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            style={
              isFormValid && !isSubmitting ? { backgroundColor: '#fe4c6f' } : undefined
            }
          >
            <Sparkles className="w-5 h-5" />
            <span>
              {isSubmitting
                ? 'Mempersiapkan Queue Process...'
                : validKeywords.length > 0
                ? `Generate ${validKeywords.length} Artikel SEO`
                : 'Generate Artikel SEO'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
