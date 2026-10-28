import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { BingoCard } from '../types/bingo';

interface DeleteCardModalProps {
  card: BingoCard | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cardId: string) => Promise<void>;
  isDeleting: boolean;
}

export const DeleteCardModal: React.FC<DeleteCardModalProps> = ({
  card,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !card) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-card-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={isDeleting ? undefined : onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-card-title" className="font-bold text-sm">
                Delete Bingo Card?
              </h3>
              <p className="text-[11px] text-rose-100">Confirm permanent card removal</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block mb-1">Target Card ID:</span>
            <span className="font-mono text-base font-extrabold text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-200 inline-block shadow-2xs">
              {card.id}
            </span>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              {card.isRegistered ? (
                <p>
                  This card is currently <span className="font-bold">registered</span> for the championship game. Deleting it will remove it from the current game session and deduct it from your active cards.
                </p>
              ) : (
                <p>
                  This card is <span className="font-bold">unregistered</span>. Deleting it will permanently remove it from your selection.
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onConfirm(card.id)}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
