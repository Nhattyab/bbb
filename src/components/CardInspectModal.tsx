import React from 'react';
import { X, ShieldAlert, Star, Info } from 'lucide-react';
import { BingoCard, BingoBall } from '../types/bingo';
import { COLUMN_COLORS } from '../utils/bingoRules';

interface CardInspectModalProps {
  card: BingoCard | null;
  calledNumbers: BingoBall[];
  onClose: () => void;
}

export const CardInspectModal: React.FC<CardInspectModalProps> = ({
  card,
  calledNumbers,
  onClose,
}) => {
  if (!card) return null;

  const calledSet = new Set(calledNumbers.map((b) => b.number));
  const columns = ['B', 'I', 'N', 'G', 'O'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Card Inspector: {card.id}</h3>
              <p className="text-[11px] text-slate-400">Card details & 5x5 matrix</p>
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

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Status info */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Owner ID</span>
              <span className="font-mono font-semibold text-slate-800">{card.userId}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Status</span>
              {card.isBlocked ? (
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Card is blocked.
                </span>
              ) : card.isRegistered ? (
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Registered
                </span>
              ) : (
                <span className="font-medium text-slate-500">Unregistered</span>
              )}
            </div>
          </div>

          {/* 5x5 Matrix */}
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
              {card.matrix.map((row, r) =>
                row.map((val, c) => {
                  const isCenter = (r === 2 && c === 2) || val === 'FREE';
                  const isMarked = card.marked?.[r]?.[c] ?? isCenter;
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
                        isMarked
                          ? 'bg-blue-600 text-white font-black shadow-xs ring-1 ring-blue-400'
                          : isCalled
                          ? 'bg-slate-800 text-slate-300 font-semibold border border-slate-700'
                          : 'bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      <span>{val}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Blue cells indicate marked squares on this card</span>
          </div>
        </div>
      </div>
    </div>
  );
};
