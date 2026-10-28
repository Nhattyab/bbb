import React from 'react';
import { X, Radio, Clock } from 'lucide-react';
import { BingoBall } from '../types/bingo';
import { COLUMN_COLORS, getLetterForNumber } from '../utils/bingoRules';

interface NumberDetailModalProps {
  number: number | null;
  ball: BingoBall | null;
  isCalled: boolean;
  onClose: () => void;
}

export const NumberDetailModal: React.FC<NumberDetailModalProps> = ({
  number,
  ball,
  isCalled,
  onClose,
}) => {
  if (number === null) return null;

  const letter = getLetterForNumber(number);
  const color = COLUMN_COLORS[letter];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xs bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 text-center p-5 space-y-3.5 animate-in zoom-in-95 duration-200">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`w-20 h-20 rounded-2xl mx-auto flex flex-col items-center justify-center text-white shadow-lg ${color.bg}`}
        >
          <span className="text-xs font-black uppercase opacity-90 leading-none">{letter}</span>
          <span className="text-3xl font-black font-mono leading-none mt-1">{number}</span>
        </div>

        <div>
          <h3 className="font-bold text-sm text-slate-900">
            {letter}-{number}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCalled ? 'Officially called by the host' : 'Not yet called in this game'}
          </p>
        </div>

        {ball && (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Call Sequence: #{ball.sequence}</span>
            <span>{new Date(ball.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  );
};
