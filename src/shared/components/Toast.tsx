import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-xl border text-sm font-medium transition-all transform duration-200 animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-zinc-900/95 text-emerald-400 border-emerald-500/30'
              : toast.type === 'error'
              ? 'bg-zinc-900/95 text-rose-400 border-rose-500/30'
              : 'bg-zinc-900/95 text-blue-400 border-blue-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 text-blue-400" />}
            <span className="text-zinc-100">{toast.message}</span>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-colors ml-3"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
