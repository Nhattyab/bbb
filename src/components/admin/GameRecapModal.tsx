import React from 'react';
import { X, Trophy, Calendar, Hash, Users, Sparkles } from 'lucide-react';
import { HistoricalGame } from '../../types/bingo';

interface GameRecapModalProps {
  game: HistoricalGame | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GameRecapModal({ game, isOpen, onClose }: GameRecapModalProps) {
  if (!isOpen || !game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Championship Recap</h3>
              <span className="text-[11px] font-mono text-blue-300">#{game.gameCode}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto admin-scrollbar">
          <div>
            <h2 className="text-xl font-black text-slate-800">{game.title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Completed on {new Date(game.completedAt).toLocaleString()} ({game.durationMinutes} min session)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Winning Rule</span>
              <span className="text-xs font-bold text-slate-800 capitalize">
                {game.winningRule.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Balls Drawn</span>
              <span className="text-xs font-bold text-slate-800">{game.ballsCalledCount} / 75</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Prize Pool</span>
              <span className="text-xs font-bold text-emerald-600">${game.prizePool.toFixed(2)}</span>
            </div>
          </div>

          {/* Winners Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Confirmed Champions</h4>
            {game.winners.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No winners recorded for this game.</p>
            ) : (
              <div className="space-y-2">
                {game.winners.map((w, idx) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-200 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800">{w.displayName}</div>
                        <div className="text-[10px] text-amber-800 font-medium">Card #{w.cardId}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm text-emerald-700">${w.prizeAmount.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">{w.prizeCategory}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ball Sequence */}
          {game.ballSequence && game.ballSequence.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Ball Draw Sequence ({game.ballSequence.length})
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {game.ballSequence.map((ball) => (
                  <span
                    key={ball.sequence}
                    className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-mono font-bold text-slate-800"
                  >
                    {ball.letter}-{ball.number}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition"
          >
            Close Recap
          </button>
        </div>
      </div>
    </div>
  );
}
