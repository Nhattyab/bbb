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
              ${game.totalPrizePool.toFixed(2)}
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
              Rule: <span className="font-semibold text-slate-800">{WINNING_RULE_LABELS[game.activeWinningRule]}</span> · Code: <span className="font-mono font-bold text-blue-600">{game.gameCode}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {game.status === 'in_progress' ? (
              <button
                type="button"
                onClick={onPauseGame}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Game</span>
              </button>
            ) : game.status === 'paused' ? (
              <button
                type="button"
                onClick={onResumeGame}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Game</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartGame}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Game (15s Countdown)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCallNumber}
              disabled={game.status !== 'in_progress'}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Hash className="w-4 h-4" />
              <span>Call Next Ball</span>
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

            <button
              type="button"
              onClick={onResetGame}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
              title="Reset Round"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
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
