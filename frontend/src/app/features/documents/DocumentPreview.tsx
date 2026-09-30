import React from 'react';
import { DocumentResponse } from '../../types/document';
import { formatFileSize, isPreviewable } from '../../utils/fileHelpers';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

interface DocumentPreviewProps {
  document: DocumentResponse | null;
  fileUrl: string | null;
  isLoadingUrl: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  fileUrl,
  isLoadingUrl,
  onClose,
  onDownload,
}) => {
  if (!document) return null;

  const previewType = isPreviewable(document.fileCategory, document.mimeType, document.originalName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-semibold text-white truncate">{document.originalName}</h3>
              <p className="text-xs text-zinc-400">
                {formatFileSize(document.fileSize)} • Uploaded by {document.uploader.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center min-h-[300px] bg-zinc-950/50">
          {isLoadingUrl ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400 text-sm">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span>Loading preview...</span>
            </div>
          ) : !fileUrl ? (
            <div className="text-center text-zinc-500 text-sm">
              Preview is not available for this file.
            </div>
          ) : previewType === 'image' ? (
            <img
              src={fileUrl}
              alt={document.originalName}
              className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : previewType === 'video' ? (
            <video
              src={fileUrl}
              controls
              autoPlay
              className="max-h-[65vh] max-w-full rounded-lg shadow-lg"
            >
              Your browser does not support HTML5 video preview.
            </video>
          ) : previewType === 'pdf' ? (
            <iframe
              src={fileUrl}
              title={document.originalName}
              className="w-full h-[65vh] rounded-lg border border-zinc-800 shadow-md bg-white"
            />
          ) : (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{document.originalName}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Direct in-browser preview is not supported for this file type ({document.mimeType}).
                </p>
              </div>
              <button
                onClick={onDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download to View</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
