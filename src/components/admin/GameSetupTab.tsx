import React, { useState } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { GameSession, WinningPattern } from '../../types/bingo';
import { WINNING_RULE_LABELS } from '../../utils/bingoRules';

interface GameSetupTabProps {
  game: GameSession | null;
  onSaveSetup: (setup: any) => Promise<void>;
  onResetGame: (config?: any) => Promise<void>;
}

export function GameSetupTab({ game, onSaveSetup, onResetGame }: GameSetupTabProps) {
  const [title, setTitle] = useState(game?.title || '10:20 BINGO Championship');
  const [activeRule, setActiveRule] = useState<WinningPattern>(game?.activeWinningRule || 'horizontal_line');
  const [entryPrice, setEntryPrice] = useState(game?.entryPrice?.toString() || '1.00');
  const [prizePool, setPrizePool] = useState(game?.totalPrizePool?.toString() || '150.00');
  const [interval, setInterval] = useState(game?.autoCallIntervalSeconds?.toString() || '7');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSetup({
        title,
        activeWinningRule: activeRule,
        entryPrice: parseFloat(entryPrice) || 0,
        totalPrizePool: parseFloat(prizePool) || 0,
        autoCallIntervalSeconds: parseInt(interval, 10) || 7,
      });
      alert('Championship configuration updated!');
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const rules: { id: WinningPattern; label: string; desc: string }[] = [
    { id: 'horizontal_line', label: 'Horizontal Line', desc: 'Any complete row (5 squares including Free space)' },
    { id: 'vertical_line', label: 'Vertical Line', desc: 'Any complete column (5 squares including Free space)' },
    { id: 'diagonal_line', label: 'Diagonal Line', desc: 'Corner to corner line (5 squares including Free space)' },
    { id: 'four_corners', label: 'Four Corners', desc: 'All 4 outer corner squares (Top-Left, Top-Right, Bottom-Left, Bottom-Right)' },
    { id: 'blackout', label: 'Full Card / Blackout', desc: 'All 25 squares on the card' },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-1">Championship Configuration</h3>
        <p className="text-xs text-slate-500 mb-5">
          Configure rule, prize amounts, and calling timing for the shared tournament.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Championship Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-blue-600 transition"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1.5">
              Active Winning Rule (Strict 1-Rule Tournament)
            </label>
            <div className="space-y-2">
              {rules.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    activeRule === r.id
                      ? 'bg-blue-50/70 border-blue-400 text-blue-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rule"
                    value={r.id}
                    checked={activeRule === r.id}
                    onChange={() => setActiveRule(r.id)}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <span className="font-bold block text-xs">{r.label}</span>
                    <span className="text-[11px] text-slate-500">{r.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-blue-600 transition"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Total Prize Pool ($)</label>
              <input
                type="number"
                step="5"
                min="0"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-blue-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Auto-Call Interval (Seconds)</label>
            <input
              type="number"
              min="5"
              max="15"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-blue-600 transition"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onResetGame()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Reset to Defaults
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
