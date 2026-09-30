import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { documentApi } from './documentApi';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { ToastMessage } from '../../../shared/components/Toast';

interface UploadDropzoneProps {
  projectId: number;
  onUploadSuccess: () => void;
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  projectId,
  onUploadSuccess,
  onAddToast,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadFileName(file.name);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      await documentApi.uploadDocument(projectId, file, (progress) => {
        setUploadProgress(progress);
      });
      onAddToast({ type: 'success', message: `Successfully uploaded ${file.name}` });
      onUploadSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      onAddToast({ type: 'error', message: e.message || 'Failed to upload document' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 52428800, // 50MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp'],
      'video/*': ['.mp4', '.mov', '.avi'],
    },
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/10'
            : isDragReject
            ? 'border-rose-500 bg-rose-500/10'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/80'
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl mb-1">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="text-sm font-medium text-zinc-200">
            {isDragActive ? (
              <span className="text-blue-400">Drop your file here to upload</span>
            ) : (
              <span>
                <strong className="text-blue-400 hover:underline">Click to upload</strong> or drag and drop files
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-400 max-w-md">
            PDF, DOCX, XLSX, PPTX, MD, TXT, Images (JPG, PNG, GIF, SVG) or Videos (MP4, MOV, AVI) up to 50MB
          </p>
        </div>
      </div>

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="font-medium truncate max-w-xs">{uploadFileName}</span>
            <span className="text-blue-400 font-semibold">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-150 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
