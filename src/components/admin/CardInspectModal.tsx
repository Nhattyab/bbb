import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react';
import { BingoCard, BingoBall } from '../../types/bingo';

interface CardInspectModalProps {
  card: BingoCard | null;
  calledNumbers: BingoBall[];
  onClose: () => void;
  onBlockCard: (cardId: string) => void;
  onUnblockCard: (cardId: string) => void;
}

export function CardInspectModal({
  card,
  calledNumbers,
  onClose,
  onBlockCard,
  onUnblockCard,
}: CardInspectModalProps) {
  if (!card) return null;

  const calledSet = new Set(calledNumbers.map((b) => b.number));
  const headers = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Inspect Bingo Card</h3>
            <span className="text-[11px] font-mono text-blue-300">#{card.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notice */}
        {card.isBlocked && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center gap-2 text-xs text-rose-800 font-bold">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Card is blocked: {card.blockReason || 'Blocked by host'}</span>
          </div>
        )}

        {/* 5x5 Matrix */}
        <div className="p-6">
          <div className="grid grid-cols-5 gap-1.5 mb-2 text-center font-black text-sm text-slate-700">
            {headers.map((h) => (
              <div key={h} className="py-1 bg-slate-100 rounded-lg">
                {h}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {card.matrix.map((row, r) =>
              row.map((val, c) => {
                const isFree = val === 'FREE';
                const isMarked = card.marked?.[r]?.[c] || isFree;
                const isCalled = isFree || calledSet.has(val as number);

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl font-bold text-sm border transition ${
                      isFree
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : isMarked
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : isCalled
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{isFree ? '★' : val}</span>
                    {isMarked && !isFree && (
                      <span className="text-[8px] uppercase tracking-wider font-semibold opacity-80">
                        Marked
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {card.isBlocked ? (
            <button
              onClick={() => {
                onUnblockCard(card.id);
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition"
            >
              Unblock Card
            </button>
          ) : (
            <button
              onClick={() => {
                onBlockCard(card.id);
                onClose();
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition"
            >
              Block Card
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
