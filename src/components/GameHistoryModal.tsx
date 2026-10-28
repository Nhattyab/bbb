import React, { useState, useEffect } from 'react';
import { X, History, Trophy, Award, Clock } from 'lucide-react';
import { HistoricalGame } from '../types/bingo';
import { WINNING_RULE_LABELS } from '../utils/bingoRules';

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameHistoryModal: React.FC<GameHistoryModalProps> = ({ isOpen, onClose }) => {
  const [games, setGames] = useState<HistoricalGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/admin/history')
        .then((res) => res.json())
        .then((data) => {
          setGames(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Championship Game History</h3>
              <p className="text-[11px] text-slate-400">Past rounds and confirmed winners</p>
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

        <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs text-slate-700">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading historical games...</div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No completed games in history yet.</div>
          ) : (
            games.map((g) => (
              <div
                key={g.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs">{g.title}</div>
                  <span className="font-mono text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {g.gameCode}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>Rule: {WINNING_RULE_LABELS[g.winningRule] || g.winningRule}</span>
                  <span>Balls Called: {g.ballsCalledCount}</span>
                  <span>Prize: ${g.prizePool.toFixed(2)}</span>
                </div>
                {g.winners && g.winners.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Winner: {g.winners.map((w) => w.displayName).join(', ')}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
