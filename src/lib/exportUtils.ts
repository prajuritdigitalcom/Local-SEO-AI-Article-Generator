import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Batch } from '../types';

export function getExportRows(batch: Batch) {
  return batch.items.map((item) => ({
    'Kata Kunci': item.keyword,
    'Status': item.status === 'success' ? 'Selesai' : item.status === 'failed' ? 'Gagal' : 'Diproses',
    'Artikel': item.article || '',
    'Jumlah Kata': item.actualWordCount !== null ? item.actualWordCount : '',
    'Gaya Bahasa': item.languageStyleUsed || batch.languageStyle,
    'Konteks Lokal Terdeteksi':
      item.localContextDetected === true
        ? 'Ya'
        : item.localContextDetected === false
        ? 'Tidak'
        : '',
    'Alasan Gagal': item.errorReason || '',
  }));
}

function getFormattedFileName(batchId: string, ext: 'csv' | 'xlsx'): string {
  const shortId = batchId.replace('b_', '').substring(0, 8);
  const dateStr = new Date().toISOString().split('T')[0];
  return `local-seo-articles_${shortId}_${dateStr}.${ext}`;
}

export function exportToCSV(batch: Batch) {
  const rows = getExportRows(batch);
  const csvContent = Papa.unparse(rows, {
    quotes: true,
    header: true,
  });

  // Prepend UTF-8 BOM (\uFEFF) to prevent Indonesian character encoding issues in Excel
  const bomCsv = '\uFEFF' + csvContent;

  const blob = new Blob([bomCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', getFormattedFileName(batch.id, 'csv'));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(batch: Batch) {
  const rows = getExportRows(batch);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 35 }, // Kata Kunci
    { wch: 12 }, // Status
    { wch: 80 }, // Artikel
    { wch: 15 }, // Jumlah Kata
    { wch: 25 }, // Gaya Bahasa
    { wch: 25 }, // Konteks Lokal Terdeteksi
    { wch: 35 }, // Alasan Gagal
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Artikel Local SEO');

  XLSX.writeFile(workbook, getFormattedFileName(batch.id, 'xlsx'));
}
