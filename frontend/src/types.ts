export interface PredictionResult {
  originalSequence: string;
  editedSequence: string;
  changeIndicator: string;
  efficiency: number;
  changedPosition: number;
  originalBase: string;
  newBase: string;
  message: string;
  originalEfficiency: number;
  gcContent?: number;
  explanation?: string;
  meltingTemp?: number;
  molecularWeight?: number;
  id?: string;
}

export interface CompareResult {
  alignment_seq1: string;
  alignment_match: string;
  alignment_seq2: string;
  matches: number;
  mismatches: number;
  gaps: number;
  similarity_percent: number;
  seq1_tm: number;
  seq2_tm: number;
  seq1_mw: number;
  seq2_mw: number;
  seq1_gc: number;
  seq2_gc: number;
}

export interface OffTargetSite {
  variant: string;
  position: number;
  original_base: string;
  new_base: string;
  mismatches: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  region: string;
}

export interface OffTargetResult {
  sites: OffTargetSite[];
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
