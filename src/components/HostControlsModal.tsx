import React, { useState } from 'react';
import { X, Play, Pause, RotateCcw, Radio, Shield, CheckCircle2 } from 'lucide-react';
import { GameSession, WinningPattern } from '../types/bingo';
import { WINNING_RULE_LABELS } from '../utils/bingoRules';

interface HostControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameSession | null;
  onStartGame: () => void;
  onCallNextNumber: () => void;
  onToggleAutoCall: (active: boolean) => void;
  onToggleRegistration: (open: boolean) => void;
  onSaveSetup: (setup: any) => void;
  onResetGame: (title: string, rule: any, price: number, pool: number, interval: number) => void;
  onBlockCard: (cardId: string, reason: string) => void;
  onCancelGame: () => void;
}

export const HostControlsModal: React.FC<HostControlsModalProps> = ({
  isOpen,
  onClose,
  game,
  onStartGame,
  onCallNextNumber,
  onToggleAutoCall,
  onToggleRegistration,
  onSaveSetup,
  onResetGame,
  onBlockCard,
  onCancelGame,
}) => {
  const [manualCardId, setManualCardId] = useState('');
  const [blockReason, setBlockReason] = useState('Administrative action');

  if (!isOpen || !game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Host Quick Controls</h3>
              <p className="text-[11px] text-amber-100">Live game status: {game.status}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onStartGame();
                onClose();
              }}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Game (15s)</span>
            </button>

            <button
              type="button"
              onClick={onCallNextNumber}
              disabled={game.status !== 'in_progress' && game.status !== 'running'}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Radio className="w-4 h-4" />
              <span>Call 1 Number</span>
            </button>
          </div>

          {/* Auto Caller */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block text-xs">Auto Caller</span>
              <span className="text-[11px] text-slate-500">Interval: {game.autoCallIntervalSeconds || 7}s</span>
            </div>
            <button
              type="button"
              onClick={() => onToggleAutoCall(!game.autoCallActive)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                game.autoCallActive
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-emerald-600 text-white shadow-2xs'
              }`}
            >
              {game.autoCallActive ? 'Stop Auto' : 'Start Auto'}
            </button>
          </div>

          {/* Card Registration Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block text-xs">Card Registration</span>
              <span className="text-[11px] text-slate-500">
                {game.registrationOpen ? 'Open for players' : 'Closed'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggleRegistration(!game.registrationOpen)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {game.registrationOpen ? 'Close Registration' : 'Open Registration'}
            </button>
          </div>

          {/* Block Card Form */}
          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 space-y-2">
            <span className="font-bold text-rose-900 block text-xs">Block A Card</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Card ID (e.g. CARD-1024-1)"
                value={manualCardId}
                onChange={(e) => setManualCardId(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (manualCardId.trim()) {
                    onBlockCard(manualCardId.trim(), blockReason);
                    setManualCardId('');
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
