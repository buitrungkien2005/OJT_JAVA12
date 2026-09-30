import { apiClient } from '../../../shared/api/apiClient';
import { DocumentResponse, DocumentUrlResponse, FileCategory } from '../../types/document';
import { PagedResponse } from '../../types/user';

export const documentApi = {
  async uploadDocument(
    projectId: number,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<DocumentResponse>(`/documents/projects/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  async getProjectDocuments(
    projectId: number,
    page = 0,
    size = 10,
    search?: string,
    category?: FileCategory
  ): Promise<PagedResponse<DocumentResponse>> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    if (category) {
      params.set('category', category);
    }
    const res = await apiClient.get<PagedResponse<DocumentResponse>>(
      `/documents/projects/${projectId}?${params.toString()}`
    );
    return res.data;
  },

  async getDocumentById(id: number): Promise<DocumentResponse> {
    const res = await apiClient.get<DocumentResponse>(`/documents/${id}`);
    return res.data;
  },

  async getDocumentDownloadUrl(id: number): Promise<DocumentUrlResponse> {
    const res = await apiClient.get<DocumentUrlResponse>(`/documents/${id}/url`);
    return res.data;
  },

  async deleteDocument(id: number): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  },
};
