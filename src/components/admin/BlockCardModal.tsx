import React, { useState } from 'react';
import { X, AlertOctagon } from 'lucide-react';

interface BlockCardModalProps {
  cardId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBlock: (cardId: string, reason: string) => void;
}

export function BlockCardModal({
  cardId,
  isOpen,
  onClose,
  onConfirmBlock,
}: BlockCardModalProps) {
  const [reason, setReason] = useState('Invalid claims / administrative restriction');

  if (!isOpen || !cardId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmBlock(cardId, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5" />
            <h3 className="font-bold text-sm">Block Bingo Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-rose-200 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to block card <strong className="font-mono text-slate-900">#{cardId}</strong>?
            Blocked cards cannot claim Bingo or win prize pools in this game.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Blocking
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Confirm Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
