import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onClose,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4"
    >
      <div className="bg-white rounded-lg max-w-sm w-full shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded flex-shrink-0 ${
                isDestructive ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-700'
              }`}
              aria-hidden="true"
            >
              <AlertTriangle className="w-4 h-4" />
            </div>

            <div className="flex-1">
              <h3 id="confirm-dialog-title" className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {title}
              </h3>
              <p id="confirm-dialog-desc" className="mt-1 text-xs text-slate-600 leading-relaxed">
                {description}
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Fechar"
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium text-white transition ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
