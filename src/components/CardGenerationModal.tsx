import React, { useState } from 'react';
import { X, Sparkles, Layers, Ticket, Check } from 'lucide-react';

interface CardGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (count: number) => Promise<boolean>;
  currentCardCount: number;
  maxCards: number;
  entryPrice: number;
}

export const CardGenerationModal: React.FC<CardGenerationModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  currentCardCount,
  maxCards,
  entryPrice,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const remainingCards = Math.max(0, maxCards - currentCardCount);
  const allowedQuantity = Math.min(quantity, remainingCards);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allowedQuantity < 1) return;

    setIsGenerating(true);
    const success = await onGenerate(allowedQuantity);
    setIsGenerating(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={isGenerating ? undefined : onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Generate Bingo Cards</h3>
              <p className="text-[11px] text-rose-100">Add cards to your game selection</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isGenerating}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Current Cards</span>
              <span className="font-mono text-sm font-bold text-slate-900">{currentCardCount} / {maxCards}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-medium block">Remaining Allowed</span>
              <span className="font-mono text-sm font-bold text-indigo-600">{remainingCards}</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-900 block mb-1.5">
              Select Number of Cards to Generate
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  disabled={cnt > remainingCards}
                  onClick={() => setQuantity(cnt)}
                  className={`py-2 rounded-xl font-mono font-bold text-xs transition border cursor-pointer ${
                    quantity === cnt
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : cnt > remainingCards
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  +{cnt}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <p className="font-bold mb-0.5">Important:</p>
            <p>Generated cards are created as unregistered. You must click "Register Card" on each card before the game starts to participate.</p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={isGenerating}
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || remainingCards < 1}
              className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : `Generate (${allowedQuantity})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
