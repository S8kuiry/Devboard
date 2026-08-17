import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';

export interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemName?: string;
  description?: string;
  /** If true, requires the user to type the item name (or "DELETE") to confirm */
  requireVerification?: boolean;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  itemName,
  description = "This action cannot be undone. This will permanently remove the item from your workspace.",
  requireVerification = false,
}: DeleteModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Target phrase user must type to confirm
  const targetPhrase = itemName || 'DELETE';
  const isVerified = !requireVerification || confirmInput.trim() === targetPhrase;

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isVerified || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Delete action failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Rendered into <body> so the overlay escapes layout stacking contexts & sidebar z-indexes
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 transition-all">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-md rounded-xl border border-rose-500/20 bg-slate-900/80 p-6 shadow-[0_8px_32px_0_rgba(225,29,72,0.15)] backdrop-blur-2xl space-y-5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Red Accent */}
        <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 tracking-wide">
                {title}
              </h3>
              {itemName && (
                <p className="text-xs font-mono text-rose-400 mt-0.5 truncate max-w-[240px]">
                  {itemName}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description Body */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {description}
        </p>

        {/* Optional Type-to-Confirm Input */}
        {requireVerification && (
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-mono text-slate-400 block">
              To confirm, type <span className="text-rose-300 font-semibold select-all">{targetPhrase}</span> below:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={targetPhrase}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-xs font-medium text-slate-300 transition-all disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isVerified || isDeleting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-gradient-to-r from-rose-600/70 to-red-600/90 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-xs font-medium text-white shadow-lg shadow-rose-600/20 transition-all"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}