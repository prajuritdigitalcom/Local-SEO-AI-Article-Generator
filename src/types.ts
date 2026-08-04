export type LanguageStyle =
  | 'formal-informatif'
  | 'personal-storytelling'
  | 'to-the-point-persuasif'
  | 'konsultatif'
  | 'acak';

export type ItemStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface GenerationItem {
  id: string;
  batchId: string;
  keyword: string;
  status: ItemStatus;
  article: string | null;
  actualWordCount: number | null;
  targetWordCount?: number;
  languageStyleUsed: string | null;
  localContextDetected: boolean | null;
  errorReason: string | null;
  generationTimeMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  createdAt: string;
  referenceInfo: string;
  languageStyle: LanguageStyle;
  targetWordCount: number | 'random';
  totalItems: number;
  completedItems: number;
  status: 'processing' | 'completed';
  items: GenerationItem[];
}

export interface CreateBatchInput {
  keywords: string[];
  referenceInfo: string;
  languageStyle: LanguageStyle;
  targetWordCount: number | 'random';
}

export interface VariationSeed {
  openingAngle: string;
  logicalFlow: string;
  focusEmphasis: string;
  sentenceStyle: string;
}

export interface ServerKeyStatus {
  hasServerKey: boolean;
  totalServerKeys: number;
  activeKeys: number;
}
