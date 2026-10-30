import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  Ticket,
  Clock,
  Sparkles,
  Copy,
  Check,
  Lock,
  Users,
  User as UserIcon,
} from 'lucide-react';
import { BingoBall, GameSession, Winner, BlockedCard } from '../types/bingo';
import { WINNING_RULE_LABELS } from '../utils/bingoRules';
import { BingoBoard75 } from './BingoBoard75';
import { BlockedCardsSection } from './BlockedCardsSection';
import { WinnersSection } from './WinnersSection';

interface CollapsibleGameInfoProps {
  game: GameSession | null;
  calledNumbers: BingoBall[];
  latestBall: BingoBall | null;
  countdownSeconds?: number;
  onNumberClick?: (number: number) => void;
  isHost?: boolean;
  onSelectWinnerCard: (winner: Winner) => void;
  onSelectBlockedCardId: (cardId: string) => void;
}

export const CollapsibleGameInfo: React.FC<CollapsibleGameInfoProps> = ({
  game,
  calledNumbers,
  latestBall,
  countdownSeconds,
  onNumberClick,
  isHost,
  onSelectWinnerCard,
  onSelectBlockedCardId,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!game) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'next_game':
        return { label: 'Next Game', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'setup':
        return { label: 'Setup Mode', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'registration_open':
        return { label: 'Registration Open', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'registration_closed':
        return { label: 'Registration Closed', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'starting_countdown':
      case 'pre_game_countdown':
        return {
          label: countdownSeconds && countdownSeconds > 0 ? `Starting in ${countdownSeconds}s` : 'Starting Soon',
          bg: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse font-black',
        };
      case 'running':
      case 'in_progress':
        return { label: 'In Progress', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'paused':
        return { label: 'Paused', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'stopped':
        return { label: 'Stopped', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'claim_review':
      case 'checking_winners':
        return { label: 'Claim Window Open', bg: 'bg-purple-100 text-purple-900 border-purple-300 animate-pulse' };
      case 'game_completed':
      case 'winner_confirmed':
      case 'completed':
        return { label: 'Game Completed', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'cancelled':
        return { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: status.replace(/_/g, ' '), bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const statusInfo = getStatusBadge(game.status);
  const ruleLabel = game.activeWinningRule === 'not_set'
    ? 'Not Set'
    : WINNING_RULE_LABELS[game.activeWinningRule] || game.activeWinningRule;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(game.gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      aria-label="Championship Information"
      className="bg-white rounded-2xl shadow-xs border border-slate-200/80 transition-all duration-300 overflow-hidden"
    >
      {/* Header bar of the championship card */}
      <div className="p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm truncate">{game.title}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}
              >
                {statusInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="font-mono text-indigo-600 font-semibold">{game.gameCode}</span>
              <span>·</span>
              <span className="text-amber-700 font-semibold truncate">{ruleLabel.split('(')[0].trim()}</span>
              <span>·</span>
              <span>Pool: ${(game.totalPrizePool ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Show More / Show Less Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 transition-colors cursor-pointer"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Game Details Panel */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-4 text-xs animate-in fade-in duration-200">
          {/* Highlighted Active Winning Rule Box */}
          <div className="p-3 bg-gradient-to-r from-amber-50 to-indigo-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                  Active Winning Rule (1 Rule Only)
                </span>
                {game.isRuleLocked && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-white px-1.5 py-0.2 rounded border border-slate-200">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Locked for Game
                  </span>
                )}
              </div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{ruleLabel}</div>
              <div className="text-[11px] text-slate-600 mt-1">
                {game.activeWinningRule === 'not_set'
                  ? 'The tournament host has not configured the winning rule for this game yet.'
                  : 'The first player to claim this exact verified pattern on a registered card triggers the 15-second claim window. Center FREE counts as covered.'}
              </div>
            </div>
          </div>

          {/* Key Metric Grid: Separate Individual Prize and Total Prize Fields */}
          <div className={`grid ${isHost ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-3'} gap-2.5`}>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-medium">Entry Price</span>
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {game.entryPrice > 0 ? `$${game.entryPrice.toFixed(2)}` : 'Free Play'}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Trophy className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">Individual Prize</span>
              </div>
              <div className="text-sm font-bold text-blue-600 font-mono">
                ${(game.individualPrize ?? 0).toFixed(2)}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium">Total Prize</span>
              </div>
              <div className="text-sm font-bold text-amber-600 font-mono">
                ${(game.totalPrizePool ?? 0).toFixed(2)}
              </div>
            </div>

            {/* ONLY rendered for authorized Host / Admin view */}
            {isHost && (
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium">Registered</span>
                </div>
                <div className="text-sm font-bold text-slate-900 font-mono">
                  {game.registeredPlayersCount} Players
                </div>
              </div>
            )}
          </div>

          {/* Game Code, Registration State & Start Time */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2">
              <span className="text-indigo-900 font-medium">Game Code:</span>
              <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                {game.gameCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                title="Copy Game Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                  game.registrationOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                Registration: {game.registrationOpen ? 'Open' : 'Closed'}
              </span>
              <div className="flex items-center gap-1 text-indigo-900 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Start: {game.startTime}</span>
              </div>
            </div>
          </div>

          {/* Embedded 75-number Bingo board */}
          <div className="pt-2 border-t border-slate-200">
            <BingoBoard75
              calledNumbers={calledNumbers}
              latestBall={latestBall}
              onNumberClick={onNumberClick}
              isHost={isHost}
              gameStatus={game.status}
            />
          </div>

          {/* REQUIREMENT 5: Relocate Blocked Cards & Game Winner Cards Sections
              Inside Championship Information Container at the bottom */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <BlockedCardsSection
              blockedCards={game.blockedCards || []}
              onSelectCardId={onSelectBlockedCardId}
            />
            <WinnersSection
              winners={game.winners || []}
              onSelectWinnerCard={onSelectWinnerCard}
            />
          </div>
        </div>
      )}
    </section>
  );
};
