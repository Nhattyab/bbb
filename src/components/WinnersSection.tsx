import React from 'react';
import { Trophy, Award, Clock, Eye } from 'lucide-react';
import { Winner } from '../types/bingo';

interface WinnersSectionProps {
  winners: Winner[];
  onSelectWinnerCard: (winner: Winner) => void;
}

export const WinnersSection: React.FC<WinnersSectionProps> = ({
  winners,
  onSelectWinnerCard,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-amber-100 p-3 space-y-2.5 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span>Game Winners</span>
            {winners.length > 0 && (
              <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full">
                {winners.length}
              </span>
            )}
          </div>
        </div>
        {winners.length > 0 && (
          <span className="text-[10px] text-slate-400">Click card ID to inspect</span>
        )}
      </div>

      {winners.length === 0 ? (
        <div className="py-2.5 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          No confirmed winners yet in this game session.
        </div>
      ) : (
        <div className="space-y-1.5 pt-1 border-t border-amber-50">
          {winners.map((w) => (
            <div
              key={w.id}
              className="p-2.5 bg-gradient-to-r from-amber-50/80 to-indigo-50/40 rounded-xl border border-amber-200/80 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 truncate">{w.displayName}</span>
                    <button
                      type="button"
                      onClick={() => onSelectWinnerCard(w)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md font-mono text-[11px] font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Inspect winning 5x5 card"
                    >
                      <span>{w.cardId}</span>
                      <Eye className="w-3 h-3 text-indigo-500" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {w.winningPattern} · {new Date(w.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-black text-xs text-emerald-600 block">
                  +${w.prizeAmount.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-400 block">{w.prizeCategory}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
