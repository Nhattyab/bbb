import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Hash,
  Volume2,
  Clock,
  Sparkles,
  AlertOctagon,
  ShieldAlert,
  Search,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { GameSession, BingoBall } from '../../types/bingo';
import { COLUMN_COLORS, WINNING_RULE_LABELS } from '../../utils/bingoRules';

interface LiveGameControlTabProps {
  game: GameSession | null;
  countdownSeconds: number;
  claimWindowSeconds: number;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onCallNumber: (num?: number) => void;
  onToggleAutoCall: (active: boolean) => void;
  onCancelGame: () => void;
  onResetGame: () => void;
}

export function LiveGameControlTab({
  game,
  countdownSeconds,
  claimWindowSeconds,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onCallNumber,
  onToggleAutoCall,
  onCancelGame,
  onResetGame,
}: LiveGameControlTabProps) {
  const [specificNum, setSpecificNum] = useState<string>('');

  if (!game) {
    return <div className="p-8 text-slate-500">Loading live game control...</div>;
  }

  const calledMap = new Map<number, BingoBall>();
  game.calledNumbers.forEach((b) => calledMap.set(b.number, b));

  const columns: { letter: 'B' | 'I' | 'N' | 'G' | 'O'; start: number; end: number }[] = [
    { letter: 'B', start: 1, end: 15 },
    { letter: 'I', start: 16, end: 30 },
    { letter: 'N', start: 31, end: 45 },
    { letter: 'G', start: 46, end: 60 },
    { letter: 'O', start: 61, end: 75 },
  ];

  const handleManualSpecificCall = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(specificNum, 10);
    if (!isNaN(num) && num >= 1 && num <= 75) {
      if (calledMap.has(num)) {
        alert(`Number ${num} has already been called.`);
        return;
      }
      onCallNumber(num);
      setSpecificNum('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Active State Countdown Banner */}
      {game.status === 'pre_game_countdown' && (
        <div className="bg-amber-500 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl font-black tabular-nums">
              {countdownSeconds}
            </div>
            <div>
              <h3 className="font-bold text-lg">Pre-Game 15-Second Countdown Active</h3>
              <p className="text-amber-100 text-xs mt-0.5">
                Registration is closed. Winning rule: {WINNING_RULE_LABELS[game.activeWinningRule]}.
                Automatic ball calling commences after countdown and a 5-second buffer.
              </p>
            </div>
          </div>
          <button
            onClick={onCancelGame}
            className="px-4 py-2 bg-white text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-50 transition cursor-pointer"
          >
            Cancel Countdown
          </button>
        </div>
      )}

      {/* Claim Window Banner */}
      {game.claimWindowActive && (
        <div className="bg-purple-600 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl font-black tabular-nums">
              {claimWindowSeconds}
            </div>
            <div>
              <h3 className="font-bold text-lg">15-Second Winner Claim Window Open</h3>
              <p className="text-purple-100 text-xs mt-0.5">
                A valid winner has claimed. Other eligible players have {claimWindowSeconds}s to claim Bingo before the game completes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Calling & Control Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {game.status === 'in_progress' ? (
            <button
              onClick={onPauseGame}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Game</span>
            </button>
          ) : game.status === 'paused' ? (
            <button
              onClick={onResumeGame}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Game</span>
            </button>
          ) : (
            <button
              onClick={onStartGame}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Game (15s Countdown)</span>
            </button>
          )}

          <button
            onClick={() => onCallNumber()}
            disabled={game.status !== 'in_progress'}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Hash className="w-4 h-4" />
            <span>Call Next Ball</span>
          </button>

          <button
            onClick={() => onToggleAutoCall(!game.autoCallActive)}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer ${
              game.autoCallActive
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{game.autoCallActive ? 'Stop Auto' : 'Auto Caller (7s)'}</span>
          </button>
        </div>

        {/* Specific Manual Ball Calling Form */}
        <form onSubmit={handleManualSpecificCall} className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={75}
            value={specificNum}
            onChange={(e) => setSpecificNum(e.target.value)}
            placeholder="Call # (1-75)"
            disabled={game.status !== 'in_progress'}
            className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-blue-600 transition"
          />
          <button
            type="submit"
            disabled={game.status !== 'in_progress' || !specificNum}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-40"
          >
            Call
          </button>
        </form>
      </div>

      {/* 75-Ball Master Grid View */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            75-Ball Master Matrix
          </h3>
          <span className="font-mono text-xs text-slate-500">
            {game.calledNumbers.length} / 75 Balls Called
          </span>
        </div>

        <div className="space-y-2 overflow-x-auto">
          {columns.map(({ letter, start, end }) => {
            const numbers: number[] = [];
            for (let i = start; i <= end; i++) numbers.push(i);
            const colColor = COLUMN_COLORS[letter];

            return (
              <div key={letter} className="flex items-center gap-2 min-w-[500px]">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white ${colColor.bg} shadow-xs shrink-0`}
                >
                  {letter}
                </div>
                <div className="grid grid-cols-15 gap-1.5 flex-1">
                  {numbers.map((num) => {
                    const isCalled = calledMap.has(num);
                    const isLatest = game.currentNumber?.number === num;

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (!isCalled && game.status === 'in_progress') {
                            onCallNumber(num);
                          }
                        }}
                        className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all select-none ${
                          isLatest
                            ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-slate-900 scale-105 shadow-sm'
                            : isCalled
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer'
                        }`}
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
    </div>
  );
}
