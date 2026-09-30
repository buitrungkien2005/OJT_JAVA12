import { FileCategory } from '../types/document';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  if (!filename || !filename.includes('.')) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getCategoryBadgeColor(category: FileCategory): { bg: string; text: string; border: string } {
  switch (category) {
    case 'IMAGE':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    case 'VIDEO':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
    case 'DOCUMENT':
    default:
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
  }
}

export function isPreviewable(category: FileCategory, mimeType?: string, filename?: string): 'image' | 'video' | 'pdf' | null {
  if (category === 'IMAGE') return 'image';
  if (category === 'VIDEO') return 'video';
  if (mimeType?.includes('pdf') || filename?.toLowerCase().endsWith('.pdf')) return 'pdf';
  return null;
}
