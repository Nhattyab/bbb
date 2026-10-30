import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Users,
  CreditCard,
  Hash,
  AlertTriangle,
  Trophy,
  ArrowRight,
  Radio,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { GameSession, AuditLogEntry } from '../../types/bingo';
import { WINNING_RULE_LABELS, COLUMN_COLORS } from '../../utils/bingoRules';

interface OverviewTabProps {
  game: GameSession | null;
  auditLogs: AuditLogEntry[];
  registeredCardsCount: number;
  totalCardsCount: number;
  pendingClaimsCount: number;
  onNavigate: (tab: any) => void;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onStopGameRound?: () => void;
  onOpenRegistration?: () => void;
  onCloseRegistration?: () => void;
  onCallNumber: () => void;
  onToggleAutoCall: (active: boolean) => void;
  onToggleRegistration: (open: boolean) => void;
  onResetGame: () => void;
  countdownSeconds: number;
  claimWindowSeconds: number;
}

export function OverviewTab({
  game,
  auditLogs,
  registeredCardsCount,
  totalCardsCount,
  pendingClaimsCount,
  onNavigate,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onStopGameRound,
  onOpenRegistration,
  onCloseRegistration,
  onCallNumber,
  onToggleAutoCall,
  onToggleRegistration,
  onResetGame,
  countdownSeconds,
  claimWindowSeconds,
}: OverviewTabProps) {
  if (!game) {
    return <div className="p-8 text-slate-500">Loading overview...</div>;
  }

  const calledCount = game.calledNumbers.length;
  const progressPercent = Math.round((calledCount / 75) * 100);

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Game Status</span>
            <span className="text-base font-black text-slate-900 uppercase mt-0.5 block">
              {game.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Registered Cards</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block font-mono">
              {registeredCardsCount} <span className="text-xs text-slate-400 font-normal">/ {totalCardsCount}</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Balls Called</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block font-mono">
              {calledCount} <span className="text-xs text-slate-400 font-normal">/ 75 ({progressPercent}%)</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Hash className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Prize Pool</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block font-mono">
              ${(game.totalPrizePool ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Control Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">{game.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rule:{' '}
              <span className="font-semibold text-slate-800">
                {game.activeWinningRule === 'not_set' ? 'Not Set' : WINNING_RULE_LABELS[game.activeWinningRule]}
              </span>{' '}
              · Code: <span className="font-mono font-bold text-blue-600">{game.gameCode}</span> · Individual: $
              {(game.individualPrize ?? 0).toFixed(2)} · Pool: ${(game.totalPrizePool ?? 0).toFixed(2)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stage 1: Unconfigured Game */}
            {game.status === 'next_game' && (
              <button
                type="button"
                onClick={() => onNavigate('setup')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Configure Game (Stage 1)</span>
              </button>
            )}

            {/* Stage 2: Setup Complete -> Open Registration */}
            {game.status === 'setup' && onOpenRegistration && (
              <button
                type="button"
                onClick={onOpenRegistration}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Open Registration (Stage 2)</span>
              </button>
            )}

            {/* Stage 3: Registration Open -> Close Registration */}
            {game.status === 'registration_open' && onCloseRegistration && (
              <button
                type="button"
                onClick={onCloseRegistration}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Close Registration (Stage 4)</span>
              </button>
            )}

            {/* Stage 4: Registration Closed -> Start Game */}
            {game.status === 'registration_closed' && (
              <>
                <button
                  type="button"
                  onClick={onStartGame}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Game (Stage 5)</span>
                </button>
                {onOpenRegistration && (
                  <button
                    type="button"
                    onClick={onOpenRegistration}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Re-open Registration
                  </button>
                )}
              </>
            )}

            {/* Active Running Gameplay */}
            {(game.status === 'running' || game.status === 'in_progress') && (
              <>
                <button
                  type="button"
                  onClick={onPauseGame}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>

                {onStopGameRound && (
                  <button
                    type="button"
                    onClick={onStopGameRound}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Stop Bingo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onCallNumber}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Hash className="w-4 h-4" />
                  <span>Call Ball</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleAutoCall(!game.autoCallActive)}
                  className={`px-3.5 py-2 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
                    game.autoCallActive
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  <span>{game.autoCallActive ? 'Stop Auto' : 'Auto Caller'}</span>
                </button>
              </>
            )}

            {/* Paused or Stopped State */}
            {(game.status === 'paused' || game.status === 'stopped') && (
              <>
                <button
                  type="button"
                  onClick={onResumeGame}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Game</span>
                </button>

                <button
                  type="button"
                  onClick={onResetGame}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                  title="Reset Round"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>Reset Round</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Tournament Ball Progress</span>
            <span className="font-mono font-bold text-slate-700">{calledCount} / 75 balls</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Audit Logs Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Recent System Events</h4>
          <button
            type="button"
            onClick={() => onNavigate('audit-logs')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All Logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-1.5 text-xs text-slate-700">
          {auditLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block truncate">{log.action}</span>
                <span className="text-[11px] text-slate-500 block truncate">{log.details}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
