import { invoke } from "@tauri-apps/api/core";
import type { Document, SearchResponse, DashboardStats } from "../types/document";

export async function getDashboardStats(): Promise<DashboardStats> {
  return invoke<DashboardStats>("get_dashboard_stats");
}

export async function listDocuments(
  offset: number,
  limit: number
): Promise<Document[]> {
  return invoke<Document[]>("list_documents", { offset, limit });
}

export async function indexDocument(filePath: string): Promise<Document> {
  return invoke<Document>("index_document", { filePath });
}

export async function indexFolder(folderPath: string): Promise<number> {
  return invoke<number>("index_folder", { folderPath });
}

export async function deleteDocument(id: string): Promise<void> {
  return invoke<void>("delete_document", { id });
}

export async function searchDocuments(
  query: string,
  page: number,
  perPage: number
): Promise<SearchResponse> {
  return invoke<SearchResponse>("search_documents", { query, page, perPage });
}

export async function getDocumentContent(
  documentId: string
): Promise<{ page_num: number; content: string }[]> {
  return invoke("get_document_content", { documentId });
}
export async function summarizeDocument(documentId: string): Promise<string> {
  return invoke<string>('summarize_document', { documentId });
}
