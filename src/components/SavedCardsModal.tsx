import React, { useState, useEffect } from 'react';
import { X, Archive, RotateCcw, Sparkles } from 'lucide-react';
import { BingoCard } from '../types/bingo';

interface SavedCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCardRestored: (card: BingoCard) => void;
}

export const SavedCardsModal: React.FC<SavedCardsModalProps> = ({
  isOpen,
  onClose,
  userId,
  onCardRestored,
}) => {
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      fetch(`/api/game/cards/history?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setCards(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, userId]);

  const handleRestore = async (cardId: string) => {
    try {
      const res = await fetch('/api/game/cards/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, userId }),
      });
      const data = await res.json();
      if (data.success && data.card) {
        onCardRestored(data.card);
        setCards((prev) => prev.filter((c) => c.id !== cardId));
      }
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 bg-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Saved Cards Archive</h3>
              <p className="text-[11px] text-indigo-200">Previous and archived Bingo cards</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs text-slate-700">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading archived cards...</div>
          ) : cards.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No saved cards in your archive.</div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-mono font-bold text-xs text-slate-900 block">{card.id}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Created: {card.cardDateString}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(card.id)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
