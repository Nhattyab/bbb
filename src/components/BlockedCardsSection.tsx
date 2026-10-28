import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { BlockedCard } from '../types/bingo';

interface BlockedCardsSectionProps {
  blockedCards: BlockedCard[];
  onSelectCardId?: (cardId: string) => void;
}

export const BlockedCardsSection: React.FC<BlockedCardsSectionProps> = ({
  blockedCards,
  onSelectCardId,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const count = blockedCards.length;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-rose-100 p-3 space-y-2.5 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Blocked Cards</span>
              <span className="font-mono text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.2 rounded-full">
                {count} {count === 1 ? 'Card' : 'Cards'}
              </span>
            </h3>
          </div>
        </div>

        {count > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Hide' : 'Show All'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {count === 0 ? (
        <div className="py-2.5 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>No blocked cards in this championship game.</span>
        </div>
      ) : isExpanded ? (
        <div className="pt-1.5 border-t border-rose-50 animate-in fade-in duration-200 space-y-2">
          <p className="text-[11px] text-slate-500">
            Click any blocked card ID to inspect its 5x5 matrix:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {blockedCards.map((b) => (
              <button
                key={b.cardId}
                type="button"
                onClick={() => onSelectCardId?.(b.cardId)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs cursor-pointer group"
                title="Inspect blocked 5x5 card"
              >
                <span>{b.cardId}</span>
                <Eye className="w-3 h-3 text-rose-500 group-hover:text-rose-700" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
