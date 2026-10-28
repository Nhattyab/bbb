import React from 'react';
import { X, Trophy, CheckCircle2, Star, Award } from 'lucide-react';
import { Winner } from '../types/bingo';
import { COLUMN_COLORS } from '../utils/bingoRules';

interface WinnerCardModalProps {
  winner: Winner | null;
  onClose: () => void;
}

export const WinnerCardModal: React.FC<WinnerCardModalProps> = ({ winner, onClose }) => {
  if (!winner) return null;

  const columns = ['B', 'I', 'N', 'G', 'O'] as const;
  const calledSet = new Set(winner.calledNumbersAtWin || []);
  const winningCoordSet = new Set(
    (winner.winningCoordinates || []).map(([r, c]) => `${r}-${c}`)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <Trophy className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Winning Card: {winner.cardId}
              </h3>
              <p className="text-xs text-amber-100">
                {winner.displayName} · {winner.winningPattern}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
            <div>
              <span className="font-bold block">Prize Awarded</span>
              <span className="font-mono text-base font-black text-amber-700">
                ${winner.prizeAmount.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="font-semibold block">{winner.prizeCategory}</span>
              <span className="text-[10px] text-slate-500">
                {new Date(winner.confirmedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* 5x5 Matrix Inspection */}
          {winner.cardMatrix ? (
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <div className="grid grid-cols-5 gap-1.5 mb-1.5 text-center">
                {columns.map((col) => (
                  <div
                    key={col}
                    className={`py-1 rounded font-black text-white ${COLUMN_COLORS[col].bg} text-xs shadow-2xs`}
                  >
                    {col}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {winner.cardMatrix.map((row, r) =>
                  row.map((val, c) => {
                    const isCenter = (r === 2 && c === 2) || val === 'FREE';
                    const isWinningCell = winningCoordSet.has(`${r}-${c}`);
                    const isCalled = typeof val === 'number' && calledSet.has(val);

                    if (isCenter) {
                      return (
                        <div
                          key={`${r}-${c}`}
                          className="aspect-square rounded-lg flex flex-col items-center justify-center font-black bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-xs"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-[8px] font-black leading-none">FREE</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all select-none ${
                          isWinningCell
                            ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black ring-2 ring-emerald-300 shadow-xs scale-102'
                            : isCalled
                            ? 'bg-blue-600/80 text-white font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <span>{val}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              Card matrix details not recorded for historical game.
            </div>
          )}

          <div className="text-center">
            <span className="text-[11px] text-slate-400 font-medium">
              Green highlight indicates verified winning pattern coordinates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
