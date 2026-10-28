import React from 'react';
import { BingoBall, BingoColumn } from '../types/bingo';
import { COLUMN_COLORS } from '../utils/bingoRules';

interface BingoBoard75Props {
  calledNumbers: BingoBall[];
  latestBall: BingoBall | null;
  onNumberClick?: (number: number) => void;
  isHost?: boolean;
  gameStatus?: string;
  onStartGame?: () => void;
  onCallNext?: () => void;
  onToggleAutoCall?: () => void;
  autoCallActive?: boolean;
}

const COLUMNS: { col: BingoColumn; start: number; end: number }[] = [
  { col: 'B', start: 1, end: 15 },
  { col: 'I', start: 16, end: 30 },
  { col: 'N', start: 31, end: 45 },
  { col: 'G', start: 46, end: 60 },
  { col: 'O', start: 61, end: 75 },
];

export const BingoBoard75: React.FC<BingoBoard75Props> = ({
  calledNumbers,
  latestBall,
  onNumberClick,
}) => {
  const calledSet = new Set(calledNumbers.map((b) => b.number));
  const latestNum = latestBall?.number;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-inner border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>Official 75-Ball Master Board</span>
          <span className="font-mono text-[10px] bg-slate-800 text-blue-400 px-2 py-0.5 rounded-full">
            {calledNumbers.length}/75 Called
          </span>
        </div>
      </div>

      <div className="space-y-1.5 overflow-x-auto">
        {COLUMNS.map(({ col, start, end }) => {
          const colTheme = COLUMN_COLORS[col];
          const numbers: number[] = [];
          for (let i = start; i <= end; i++) numbers.push(i);

          return (
            <div key={col} className="flex items-center gap-1.5 min-w-[340px]">
              {/* Column Letter Pill */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white ${colTheme.bg} shadow-xs shrink-0`}
              >
                {col}
              </div>

              {/* Row of numbers 1-15 in column */}
              <div className="grid grid-cols-15 gap-1 flex-1">
                {numbers.map((num) => {
                  const isCalled = calledSet.has(num);
                  const isLatest = num === latestNum;

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onNumberClick?.(num)}
                      className={`h-7 rounded-md text-[11px] font-bold flex items-center justify-center transition-all select-none cursor-pointer ${
                        isLatest
                          ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-white scale-105 shadow-sm animate-pulse'
                          : isCalled
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                      title={`Number ${num}${isCalled ? ' (Called)' : ''}`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
