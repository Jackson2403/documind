export interface Document {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  page_count: number;
  indexed_at: string;
  updated_at: string;
  tags: string[];
}

export interface SearchResult {
  document: Document;
  snippet: string;
  rank: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  per_page: number;
}

export interface DashboardStats {
  document_count: number;
  total_size_bytes: number;
  file_types: Record<string, number>;
  recent_documents: Document[];
}
