import React from 'react';
import { BingoBall } from '../types/bingo';
import { COLUMN_COLORS } from '../utils/bingoRules';
import { Radio } from 'lucide-react';

interface CalledNumbersHistoryProps {
  calledNumbers: BingoBall[];
  selectedNumber: number | null;
  onSelectBall?: (ball: BingoBall) => void;
}

export const CalledNumbersHistory: React.FC<CalledNumbersHistoryProps> = ({
  calledNumbers,
  selectedNumber,
  onSelectBall,
}) => {
  // Reverse order: latest first
  const reversed = [...calledNumbers].reverse();

  if (calledNumbers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          <span className="font-semibold text-slate-700">Called Numbers:</span>
          <span>Waiting for host to call the first number...</span>
        </div>
      </div>
    );
  }

  const latestBall = reversed[0];

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-900">Called Numbers History</span>
          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full font-semibold">
            {calledNumbers.length} Called
          </span>
        </div>

        {latestBall && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Latest:</span>
            <span className="font-black text-xs px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 shadow-2xs animate-pulse">
              {latestBall.letter}-{latestBall.number}
            </span>
          </div>
        )}
      </div>

      {/* Horizontal Scrollable Ball Stream */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        {reversed.map((ball, idx) => {
          const colColor = COLUMN_COLORS[ball.letter];
          const isLatest = idx === 0;
          const isSelected = selectedNumber === ball.number;

          return (
            <button
              key={`${ball.number}-${ball.sequence}`}
              type="button"
              onClick={() => onSelectBall?.(ball)}
              className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                isLatest
                  ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-300 scale-105'
                  : isSelected
                  ? 'bg-indigo-600 text-white font-black shadow-md ring-2 ring-indigo-400 scale-105'
                  : `${colColor.bg} text-white shadow-xs hover:scale-102`
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-tighter opacity-90 leading-none">
                {ball.letter}
              </span>
              <span className="text-sm font-extrabold leading-none mt-0.5 font-mono">
                {ball.number}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
