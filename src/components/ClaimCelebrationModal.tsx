import React, { useEffect } from 'react';
import { X, Trophy, Sparkles, Award } from 'lucide-react';
import { Winner } from '../types/bingo';
import confetti from 'canvas-confetti';

interface ClaimCelebrationModalProps {
  winner: Winner | null;
  onClose: () => void;
}

export const ClaimCelebrationModal: React.FC<ClaimCelebrationModalProps> = ({ winner, onClose }) => {
  useEffect(() => {
    if (winner) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }
    }
  }, [winner]);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-amber-300 overflow-hidden z-10 text-center p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-md">
          <Trophy className="w-9 h-9 fill-current" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-600 block">
            Official Winner Verified!
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-1">
            BINGO CONFIRMED!
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Congratulations, <span className="font-bold text-slate-900">{winner.displayName}</span>!
          </p>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
          <span className="text-[11px] text-amber-800 font-semibold block">{winner.winningPattern}</span>
          <span className="font-mono text-2xl font-black text-amber-600 block">
            +${winner.prizeAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">Card: {winner.cardId}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          Awesome, Continue Playing!
        </button>
      </div>
    </div>
  );
};
