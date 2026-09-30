import React, { useState, useEffect, useCallback } from 'react';
import { documentApi } from './documentApi';
import { DocumentResponse, FileCategory } from '../../types/document';
import { UploadDropzone } from './UploadDropzone';
import { DocumentPreview } from './DocumentPreview';
import { Pagination } from '../../../shared/components/Pagination';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { ToastMessage } from '../../../shared/components/Toast';
import { formatFileSize, getCategoryBadgeColor } from '../../utils/fileHelpers';
import { useAuth } from '../auth/AuthContext';
import {
  Search,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Download,
  Trash2,
  Eye,
  FileQuestion,
  Filter,
} from 'lucide-react';

interface DocumentsTabProps {
  projectId: number;
  projectOwnerId: number;
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  projectId,
  projectOwnerId,
  onAddToast,
}) => {
  const { user, isAdmin } = useAuth();

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | ''>('');

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<DocumentResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // Deletion state
  const [deletingDoc, setDeletingDoc] = useState<DocumentResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await documentApi.getProjectDocuments(
        projectId,
        currentPage,
        10,
        searchQuery,
        selectedCategory ? selectedCategory : undefined
      );
      setDocuments(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to fetch documents' });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, currentPage, searchQuery, selectedCategory, onAddToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle open preview
  const handlePreview = async (doc: DocumentResponse) => {
    setPreviewDoc(doc);
    setIsLoadingUrl(true);
    try {
      const res = await documentApi.getDocumentDownloadUrl(doc.id);
      setPreviewUrl(res.url);
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to load file preview URL' });
      setPreviewUrl(null);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Handle direct download
  const handleDownload = async (doc: DocumentResponse) => {
    try {
      const res = await documentApi.getDocumentDownloadUrl(doc.id);
      const link = document.createElement('a');
      link.href = res.url;
      link.setAttribute('download', doc.originalName);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to download file' });
    }
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    try {
      setIsDeleting(true);
      await documentApi.deleteDocument(deletingDoc.id);
      onAddToast({ type: 'success', message: `Deleted ${deletingDoc.originalName}` });
      setDeletingDoc(null);
      fetchDocuments();
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to delete document' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'VIDEO':
        return <VideoIcon className="w-5 h-5 text-purple-400" />;
      case 'DOCUMENT':
      default:
        return <FileText className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <UploadDropzone
        projectId={projectId}
        onUploadSuccess={fetchDocuments}
        onAddToast={onAddToast}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
          {[
            { label: 'All Files', value: '' },
            { label: 'Documents', value: 'DOCUMENT' },
            { label: 'Images', value: 'IMAGE' },
            { label: 'Videos', value: 'VIDEO' },
          ].map((cat) => (
            <button
              key={cat.label}
              onClick={() => {
                setSelectedCategory(cat.value as FileCategory | '');
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search files by name..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-zinc-800/40 animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileQuestion className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
            <h4 className="text-sm font-semibold text-zinc-300">No documents found</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search query or filter.'
                : 'Upload your first document, image, or video above.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {documents.map((doc) => {
              const badgeStyle = getCategoryBadgeColor(doc.fileCategory);
              const canDelete = user?.id === doc.uploader.id || user?.id === projectOwnerId || isAdmin;

              return (
                <div
                  key={doc.id}
                  onClick={() => handlePreview(doc)}
                  className="p-4 sm:px-5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div className="p-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700/60 shrink-0 group-hover:border-zinc-600 transition-colors">
                      {getFileCategoryIcon(doc.fileCategory)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                          {doc.originalName}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} shrink-0`}
                        >
                          {doc.fileCategory}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploader.fullName}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline text-zinc-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePreview(doc)}
                      title="Preview"
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      title="Download"
                      className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => setDeletingDoc(doc)}
                        title="Delete Document"
                        className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Preview Modal */}
      <DocumentPreview
        document={previewDoc}
        fileUrl={previewUrl}
        isLoadingUrl={isLoadingUrl}
        onClose={() => {
          setPreviewDoc(null);
          setPreviewUrl(null);
        }}
        onDownload={() => previewDoc && handleDownload(previewDoc)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDoc}
        title="Delete Document"
        message={`Are you sure you want to delete "${deletingDoc?.originalName}"? This action will permanently remove the file from storage.`}
        confirmText="Delete File"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingDoc(null)}
      />
    </div>
  );
};
