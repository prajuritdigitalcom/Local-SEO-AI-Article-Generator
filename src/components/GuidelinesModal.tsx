import React from 'react';
import { X, HelpCircle, ShieldAlert, Sparkles, FileText, Globe } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 space-y-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-8 h-8 rounded-lg text-white flex items-center justify-center"
              style={{ backgroundColor: '#fe4c6f' }}
            >
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Panduan Local SEO & AI Strategy
              </h3>
              <p className="text-xs text-slate-500">Prinsip kerja tool & pencegahan penalti Spam Google</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {/* Section 1: Doorway Pages Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <h4 className="font-bold text-amber-900 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pencegahan Penalti Google (Doorway Pages)</span>
            </h4>
            <p className="text-xs text-amber-800">
              Duplikasi artikel template yang sekadar menukar nama kota dikategorikan Google sebagai <em>doorway pages</em> (Spam Policies). Tool ini merotasi alur narasi, variasi sudut pandang, dan panjang artikel untuk menghasilkan konten unik natural.
            </p>
          </div>

          {/* Section 2: AI Seed Variation */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#fe4c6f]" />
              <span>Cara Kerja AI Seed Variation</span>
            </h4>
            <p className="text-xs text-slate-600">
              Pada setiap artikel yang digenerate dalam batch, sistem secara otomatis merotasi 4 dimensi variasi:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 pl-1">
              <li><strong>Sudut Pandang Pembuka:</strong> Pertanyaan retoris, skenario harian, atau solusi masalah mendesak.</li>
              <li><strong>Alur Logika:</strong> Masalah → Solusi → Keunggulan, ATAU Lokasi → Kebutuhan → Solusi.</li>
              <li><strong>Penekanan Utama:</strong> Keramahan & kenyamanan, higienitas & keahlian, atau kedekatan & efisiensi.</li>
              <li><strong>Gaya Kalimat:</strong> Mengalir hangat, lugas tegas, atau komunikatif edukatif.</li>
            </ul>
          </div>

          {/* Section 3: Deteksi Wilayah */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-[#fe4c6f]" />
              <span>Penanganan Wilayah / Lokasi</span>
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 pl-1">
              <li>
                <strong>Kata Kunci Mengandung Wilayah</strong> (mis. "Jasa Bekam Jakarta Barat"): AI mengintegrasikan karakteristik umum wilayah secara organik.
              </li>
              <li>
                <strong>Kata Kunci Tanpa Wilayah</strong> (mis. "Terapi Bekam Panggilan"): AI dilarang mengarang nama kota, fokus murni pada topik layanan.
              </li>
            </ul>
          </div>

          {/* Section 4: Tips Referensi */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h4 className="font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#fe4c6f]" />
              <span>Tips Menulis Informasi Referensi Efektif</span>
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-slate-800">Rekomendasi Struktur Informasi Referensi:</p>
              <p className="text-slate-600 leading-relaxed">
                1. Nama bisnis & spesialisasi utama.<br />
                2. 3-5 poin keunggulan unik (sertifikasi, higienitas, garansi, respon cepat).<br />
                3. Jenis keluhan / kebutuhan yang dapat ditangani.<br />
                4. Kemudahan pemesanan atau konsultasi gratis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
