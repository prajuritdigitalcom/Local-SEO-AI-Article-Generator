import { LanguageStyle, VariationSeed } from '../types.js';

/**
 * Common Indonesian location keywords and pattern heuristics to check
 * if a string likely contains a region/city/area name.
 */
const LOCATION_KEYWORDS_REGEX =
  /\b(jakarta|bogor|depok|tangerang|bekasi|bandung|semarang|surabaya|yogyakarta|jogja|solo|surakarta|malang|bali|denpasar|medan|palembang|makassar|banjarmasin|pontianak|samarinda|manado|batam|pekanbaru|padang|lampung|serang|cilegon|karawang|purwakarta|subang|sukabumi|cianjur|garut|tasikmalaya|cirebon|kuningan|indramayu|majalengka|magelang|salatiga|kudus|pati|jepara|klaten|sleman|bantul|kulonprogo|gunungkidul|sidoarjo|gresik|mojokerto|jombang|kediri|blitar|tulungagung|poso|lhokseumawe|banda aceh|pematangsiantar|binjai|kuta|ubud|jimbaran|sanur|canggu|tangsel|barat|timur|selatan|utara|pusat|kabupaten|kecamatan|kelurahan|kota|daerah|wilayah|jabodetabek)\b/i;

export function detectLocationContext(keyword: string): boolean {
  return LOCATION_KEYWORDS_REGEX.test(keyword);
}

const OPENING_ANGLES = [
  'Dibuka dengan pertanyaan retoris tentang tantangan atau kebutuhan umum warga lokal.',
  'Dibuka dengan skenario nyata sehari-hari yang dihadapi orang di area tersebut.',
  'Dibuka dengan pernyataan masalah mendesak yang sering timbul saat mencari layanan terbaik.',
  'Dibuka dengan poin fakta menarik atau observasi sosial terkait pentingnya kualitas layanan.',
  'Dibuka dengan sudut pandang konsultatif yang empati terhadap kenyamanan pembaca.',
];

const LOGICAL_FLOWS = [
  'Alur: Identifikasi masalah -> pengenalan solusi -> keunggulan utama layanan -> integrasi konteks lokasi/kemudahan akses -> ajakan penutup.',
  'Alur: Konteks wilayah/kebutuhan lokal -> masalah spesifik yang dihadapi -> penjelasan keunggulan & fakta layanan -> kesimpulan persuasif.',
  'Alur: Poin utama keunggulan layanan -> mengapa pilihan ini aman & terpercaya -> detail kepraktisan lokasi -> saran aksi langsung.',
  'Alur: Tanya-jawab naratif implisit -> pembedahan kualitas & keunggulan -> alasan memilih layanan profesional -> panduan kontak.',
];

const FOCUS_EMPHASIS = [
  'Fokus penekanan pada kenyamanan, keramahan, dan pengalaman personal pembaca.',
  'Fokus penekanan pada kredibilitas, higienitas, keahlian, dan standar profesionalitas.',
  'Fokus penekanan pada kepraktisan, kecepatan respons, kedekatan lokasi, dan efisiensi waktu.',
  'Fokus penekanan pada keamanan, ketenangan pikiran, dan kepuasan jangka panjang.',
];

const SENTENCE_STYLES = [
  'Gunakan gaya kalimat mengalir, variasi panjang-pendek yang harmonis, dan hangat.',
  'Gunakan gaya kalimat lugas, tegas, to the point, dan kaya kata kerja aktif.',
  'Gunakan gaya kalimat komunikatif, edukatif, serta mudah dipahami oleh semua kalangan.',
  'Gunakan gaya kalimat elegan, berbobot, namun tetap membumi dan ramah.',
];

export function generateVariationSeed(): VariationSeed {
  const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return {
    openingAngle: getRandom(OPENING_ANGLES),
    logicalFlow: getRandom(LOGICAL_FLOWS),
    focusEmphasis: getRandom(FOCUS_EMPHASIS),
    sentenceStyle: getRandom(SENTENCE_STYLES),
  };
}

export function resolveLanguageStyle(style: LanguageStyle): { name: string; description: string } {
  let chosenStyle = style;
  if (chosenStyle === 'acak') {
    const styles: LanguageStyle[] = [
      'formal-informatif',
      'personal-storytelling',
      'to-the-point-persuasif',
      'konsultatif',
    ];
    chosenStyle = styles[Math.floor(Math.random() * styles.length)];
  }

  switch (chosenStyle) {
    case 'formal-informatif':
      return {
        name: 'Formal-Informatif',
        description: 'Nada profesional, berbobot, seperti artikel edukatif terpercaya, minim kata gaul/slang.',
      };
    case 'personal-storytelling':
      return {
        name: 'Personal/Storytelling',
        description: 'Dibuka dengan sudut pandang cerita/pengalaman hangat, nada dekat dan personal namun tetap sopan.',
      };
    case 'to-the-point-persuasif':
      return {
        name: 'To-the-Point/Persuasif',
        description: 'Nada langsung, menonjolkan ajakan bertindak dan urgensi, kalimat lebih singkat dan berdampak.',
      };
    case 'konsultatif':
      return {
        name: 'Konsultatif/Tanya-Jawab Naratif',
        description: 'Nada empatik seperti menjawab keresahan pembaca (dalam bentuk paragraf naratif, BUKAN format Q&A kaku).',
      };
    default:
      return {
        name: 'Formal-Informatif',
        description: 'Nada profesional dan edukatif.',
      };
  }
}

export function buildPrompt(params: {
  keyword: string;
  referenceInfo: string;
  languageStyle: LanguageStyle;
  targetWordCount: number;
  seed: VariationSeed;
}): { promptText: string; resolvedStyleName: string } {
  const { keyword, referenceInfo, languageStyle, targetWordCount, seed } = params;
  const styleInfo = resolveLanguageStyle(languageStyle);

  const promptText = `
[BLOK 1 - PERAN & ATURAN FORMAT KETAT]
Kamu adalah penulis konten Local SEO profesional berbahasa Indonesia.
Tulis SATU artikel dalam bentuk paragraf naratif penuh.
ATURAN WAJIB (pelanggaran tidak dapat ditoleransi):
- JANGAN gunakan judul, H1, H2, H3, atau heading dalam bentuk apapun (TIDAK BOLEH pakai tanda #, ##, ###, atau teks judul terpisah).
- JANGAN gunakan bullet point, list, atau numbered list dalam bentuk apapun (TIDAK BOLEH pakai -, *, •, 1., 2.).
- Tulis HANYA dalam paragraf mengalir yang rapi, seolah ditulis manusia untuk dibaca manusia.
- Panjang tulisan target: ${targetWordCount} kata (toleransi ±15%).

[BLOK 2 - TOPIK & FOKUS]
Kata kunci berikut adalah fokus utama tulisan, apa adanya seperti ditulis oleh user:
"${keyword}"
Sisipkan variasi frasa dari kata kunci ini secara natural dalam narasi (jangan diulang persis kata-per-kata secara berlebihan/keyword stuffing).

[BLOK 3 - INFORMASI FAKTUAL YANG HARUS DIPERTAHANKAN]
Berikut adalah informasi yang WAJIB terkandung secara akurat dalam artikel (boleh diparafrase, tidak boleh diubah maknanya, tidak boleh dihilangkan poin pentingnya):
"""
${referenceInfo}
"""

[BLOK 4 - ANALISIS & PENANGANAN LOKASI]
Periksa kata kunci di BLOK 2 di atas:
- JIKA kata kunci mengandung nama wilayah/lokasi yang jelas (kota, kecamatan, kabupaten, provinsi, atau area yang dikenal luas): integrasikan nuansa lokal wilayah tersebut secara organik ke dalam narasi, tersebar di beberapa bagian artikel. Gunakan HANYA karakteristik umum yang memang luas diketahui tentang wilayah tersebut. JANGAN mengarang nama jalan spesifik, nama bisnis lain, atau data statistik presisi yang tidak bisa dipastikan kebenarannya. Jika detail wilayah tersebut tidak kamu ketahui dengan pasti, cukup sebut wilayahnya secara wajar tanpa detail tambahan yang berisiko keliru.
- JIKA kata kunci TIDAK mengandung indikasi wilayah/lokasi apapun: JANGAN menambahkan atau mengarang nama kota/wilayah apapun. Tulis artikel dengan fokus murni pada topik/layanannya, tanpa elemen lokasi.

[BLOK 5 - INSTRUKSI GAYA BAHASA]
Gaya bahasa yang harus digunakan: ${styleInfo.name}
${styleInfo.description}

[BLOK 6 - INSTRUKSI VARIASI]
Untuk tulisan kali ini secara spesifik:
- ${seed.openingAngle}
- ${seed.logicalFlow}
- ${seed.focusEmphasis}
- ${seed.sentenceStyle}

[BLOK 7 - PENUTUP PENEGASAN FORMAT]
Ingat: keluarkan HANYA teks artikel dalam paragraf, tanpa judul, tanpa bullet/list, tanpa catatan tambahan, tanpa kalimat pembuka seperti "Berikut artikelnya:". Langsung mulai dengan kalimat pertama artikel.

[BLOK 8 - GUARDRAIL KLAIM SENSITIF]
JANGAN membuat klaim medis/kesehatan definitif (mis. "menyembuhkan", "menghilangkan penyakit X secara permanen") kecuali eksplisit ada di BLOK 3. JANGAN mengarang angka statistik keberhasilan, testimoni spesifik, atau sertifikasi/izin yang tidak disebutkan di BLOK 3. Gunakan bahasa yang mendorong konsultasi/pemeriksaan langsung untuk topik kesehatan, bukan janji hasil pasti.
`.trim();

  return {
    promptText,
    resolvedStyleName: styleInfo.name,
  };
}

/**
 * Cleanup function to guarantee no markdown headings, bullets, or meta introductions exist.
 */
export function cleanupArticle(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove meta introductions like "Berikut artikelnya:", "Berikut adalah artikel...", etc.
  cleaned = cleaned.replace(/^(Berikut (adalah )?(artikel|tulisan)(nya)?[:\n\s]*)+/i, '');

  // Split into lines
  const lines = cleaned.split('\n');
  const processedLines: string[] = [];

  for (let line of lines) {
    let trimmed = line.trim();

    // Strip Markdown headings (# Heading, ## Heading, etc.)
    trimmed = trimmed.replace(/^#{1,6}\s+/, '');

    // Strip list markers (- item, * item, • item, 1. item)
    trimmed = trimmed.replace(/^([-*•]|\d+[\.\)])\s+/, '');

    if (trimmed.length > 0) {
      processedLines.push(trimmed);
    }
  }

  // Join lines into paragraphs. Combine consecutive non-empty lines if needed, preserving paragraph breaks
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of processedLines) {
    // If the line looks like a continuation of a paragraph
    currentParagraph.push(line);
  }

  const resultText = processedLines.join('\n\n');

  return resultText.trim();
}

/**
 * Counts words in an Indonesian text.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const words = text
    .trim()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words.length;
}
