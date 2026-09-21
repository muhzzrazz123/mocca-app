import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  requireReason?: boolean;
  reason?: string;
  onReasonChange?: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Yes, Delete',
  requireReason = false,
  reason = '',
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-mocca-900 border border-rose-500/50 rounded-2xl p-6 shadow-luxury space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-cream">{title}</h3>
            <p className="text-xs text-cream-muted mt-1 leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="text-mocca-400 hover:text-cream">
            <X size={18} />
          </button>
        </div>

        {requireReason && (
          <div>
            <label className="text-xs font-semibold text-cream-muted block mb-1">
              Reason for Deletion / Cancellation:
            </label>
            <input
              type="text"
              placeholder="e.g. Wrong bill entry, customer cancelled"
              value={reason}
              onChange={(e) => onReasonChange && onReasonChange(e.target.value)}
              className="w-full bg-mocca-850 border border-mocca-700 rounded-xl px-3 py-2 text-xs text-cream outline-none focus:border-rose-500"
              autoFocus
            />
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-mocca-800 text-cream-muted hover:text-cream text-xs font-semibold border border-mocca-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
          >
            <Trash2 size={14} /> {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
