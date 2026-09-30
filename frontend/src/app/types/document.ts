import { UserResponse } from './user';

export type FileCategory = 'DOCUMENT' | 'IMAGE' | 'VIDEO';

export interface DocumentResponse {
  id: number;
  originalName: string;
  mimeType: string;
  fileCategory: FileCategory;
  fileSize: number;
  uploader: UserResponse;
  projectId: number;
  createdAt: string;
}

export interface DocumentUrlResponse {
  url: string;
  originalName: string;
  mimeType: string;
}
