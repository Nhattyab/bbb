import React from 'react';
import {
  Star,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Trophy,
  X,
  Sparkles,
} from 'lucide-react';
import { BingoCard, BingoColumn, GameStatus } from '../types/bingo';
import { COLUMN_COLORS } from '../utils/bingoRules';

interface BingoCardViewProps {
  cards: BingoCard[];
  calledNumbers: number[];
  gameStatus: GameStatus;
  registrationOpen: boolean;
  gridColumns: number;
  sortBy: 'id' | 'recent' | 'registration' | 'marked';
  onToggleMark: (cardId: string, row: number, col: number, currentMarked: boolean) => void;
  onRegisterCard: (cardId: string) => Promise<void>;
  onRegisterAllCards: () => Promise<void>;
  onClaimBingo: (cardId: string) => Promise<void>;
  onPromptDeleteCard: (card: BingoCard) => void;
  registeringCardId: string | null;
  claimingCardId: string | null;
  registrationConflictError?: string | null;
}

const COLUMNS: BingoColumn[] = ['B', 'I', 'N', 'G', 'O'];

export const BingoCardView: React.FC<BingoCardViewProps> = ({
  cards,
  calledNumbers,
  gameStatus,
  registrationOpen,
  gridColumns,
  sortBy,
  onToggleMark,
  onRegisterCard,
  onRegisterAllCards,
  onClaimBingo,
  onPromptDeleteCard,
  registeringCardId,
  claimingCardId,
  registrationConflictError,
}) => {
  if (cards.length === 0) {
    return (
      <section
        aria-label="My Bingo Cards"
        className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-8 text-center space-y-3"
      >
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-sm">No Bingo Cards Generated</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Tap the floating red <span className="font-bold text-rose-600">+</span> button in the bottom-right
            corner to generate random cards for this game. Remember to click "Register Card" after generating!
          </p>
        </div>
      </section>
    );
  }

  // Count marked cells helper for sorting
  const getMarkedCount = (card: BingoCard): number => {
    let count = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (card.marked[r][c]) count++;
      }
    }
    return count;
  };

  // Sort cards according to user preference
  const sortedCards = [...cards].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return b.createdAt - a.createdAt;
      case 'registration':
        if (a.isRegistered === b.isRegistered) return a.id.localeCompare(b.id);
        return a.isRegistered ? -1 : 1;
      case 'marked':
        return getMarkedCount(b) - getMarkedCount(a);
      case 'id':
      default:
        return a.id.localeCompare(b.id, undefined, { numeric: true });
    }
  });

  const unregisteredCount = cards.filter((c) => !c.isRegistered).length;
  const isClaimEligible =
    gameStatus === 'in_progress' || gameStatus === 'checking_winners';

  // Responsive grid class based on gridColumns setting
  const getGridClass = () => {
    if (gridColumns === 1) return 'grid-cols-1';
    if (gridColumns === 2) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <section
      aria-label="My Bingo Cards"
      className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3.5 space-y-3.5"
    >
      {/* Top Header of My Cards & Quick Register All Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">My Bingo Cards</h2>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full font-mono">
            {cards.length} {cards.length === 1 ? 'Card' : 'Cards'}
          </span>
          {unregisteredCount > 0 && registrationOpen && (
            <span className="text-[11px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              {unregisteredCount} Unregistered
            </span>
          )}
        </div>

        {/* Register All Button */}
        {unregisteredCount > 1 && registrationOpen && gameStatus !== 'in_progress' && (
          <button
            type="button"
            onClick={onRegisterAllCards}
            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Register All ({unregisteredCount})</span>
          </button>
        )}
      </div>

      {/* Registration Conflict Alert */}
      {registrationConflictError && (
        <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-semibold">{registrationConflictError}</span>
        </div>
      )}

      {/* Responsive Continuous Grid */}
      <div className={`grid ${getGridClass()} gap-4`}>
        {sortedCards.map((card) => {
          const isRegistering = registeringCardId === card.id;
          const isClaiming = claimingCardId === card.id;
          const markedCount = getMarkedCount(card);

          return (
            <div
              key={card.id}
              className={`rounded-2xl border transition-all p-3.5 flex flex-col justify-between relative ${
                card.isBlocked
                  ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                  : card.isRegistered
                  ? 'border-indigo-200 bg-slate-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Card Meta & Badges */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono font-bold text-slate-900 text-xs bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {card.id}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {markedCount}/25 marked
                  </span>
                </div>

                {/* Status Badges and Small 'X' Delete Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {card.isBlocked ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      Blocked
                    </span>
                  ) : card.isRegistered ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Registered
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      Not Registered
                    </span>
                  )}

                  {/* REQUIREMENT 3: Small 'X' delete button in top-right of every card */}
                  <button
                    type="button"
                    onClick={() => onPromptDeleteCard(card)}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 hover:border-rose-300"
                    title={`Delete card ${card.id}`}
                    aria-label={`Delete card ${card.id}`}
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* 5x5 Card Matrix */}
              <div className="bg-slate-900 p-2 sm:p-2.5 rounded-xl shadow-inner border border-slate-800">
                {/* Column Headers: B, I, N, G, O */}
                <div className="grid grid-cols-5 gap-1 mb-1.5 text-center">
                  {COLUMNS.map((col) => {
                    const colColor = COLUMN_COLORS[col];
                    return (
                      <div
                        key={col}
                        className={`py-1 rounded-md font-black text-white ${colColor.bg} text-[11px] sm:text-xs tracking-wider shadow-2xs`}
                      >
                        {col}
                      </div>
                    );
                  })}
                </div>

                {/* 5x5 Number Grid:
                    REQUIREMENT 4: Calling a number must NEVER automatically mark, dot,
                    or visually highlight numbers on player cards. Only player manual marking shows marked state! */}
                <div className="grid grid-cols-5 gap-1">
                  {card.matrix.map((row, r) =>
                    row.map((val, c) => {
                      const isCenter = (r === 2 && c === 2) || val === 'FREE';
                      const isMarked = isCenter ? true : Boolean(card.marked[r]?.[c]);

                      if (isCenter) {
                        return (
                          <div
                            key={`${r}-${c}`}
                            className="aspect-square rounded-lg flex flex-col items-center justify-center font-black bg-gradient-to-tr from-amber-400 to-amber-500 text-amber-950 ring-2 ring-amber-300 shadow-xs"
                          >
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-[9px] font-extrabold leading-none">FREE</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={`${r}-${c}`}
                          type="button"
                          disabled={card.isBlocked}
                          onClick={() => {
                            if (card.isBlocked) return;
                            onToggleMark(card.id, r, c, isMarked);
                          }}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all relative select-none cursor-pointer ${
                            isMarked
                              ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black shadow-xs ring-2 ring-emerald-300 scale-98'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                          } ${card.isBlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <span>{val}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card Action Buttons: Register or Claim */}
              <div className="pt-2.5 mt-2 border-t border-slate-100">
                {!card.isRegistered && !card.isBlocked && (
                  <button
                    type="button"
                    disabled={isRegistering || !registrationOpen || gameStatus === 'in_progress'}
                    onClick={() => onRegisterCard(card.id)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                      registrationOpen && gameStatus !== 'in_progress'
                        ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isRegistering
                        ? 'Registering...'
                        : registrationOpen && gameStatus !== 'in_progress'
                        ? 'Register Card'
                        : 'Registration Closed'}
                    </span>
                  </button>
                )}

                {card.isRegistered && !card.isBlocked && isClaimEligible && (
                  <button
                    type="button"
                    disabled={isClaiming}
                    onClick={() => onClaimBingo(card.id)}
                    className="w-full py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 active:scale-98 text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <Trophy className="w-3.5 h-3.5 fill-current" />
                    <span>{isClaiming ? 'Verifying Claim...' : 'Claim Bingo!'}</span>
                  </button>
                )}

                {/* REQUIREMENT 11: Simplified blocked card message */}
                {card.isBlocked && (
                  <div className="text-center text-[11px] font-semibold text-rose-700 py-1.5 bg-rose-50 border border-rose-200 rounded-lg">
                    Card is blocked.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
