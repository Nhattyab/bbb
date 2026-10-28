import React from 'react';
import { X, Settings, Volume2, Smartphone, Moon, Sun, Monitor, RefreshCw, LogOut } from 'lucide-react';
import { UserPreferences } from '../types/bingo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  onClearMarkedNumbers: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onClearMarkedNumbers,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Game & Card Settings</h3>
              <p className="text-[11px] text-slate-300">Preferences and card customization</p>
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* Auto Complete Toggle */}
          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block text-xs">Auto Complete (Cross-Card Sync)</span>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                When you manually mark a called number on one card, automatically mark the same number on your other matching cards.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdatePreferences({ autoComplete: !preferences.autoComplete })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                preferences.autoComplete ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs ${
                  preferences.autoComplete ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Sound & Voice Options */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs">Audio & Caller</h4>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-600" />
                <span className="font-medium">Sound Effects</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ soundEnabled: !preferences.soundEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  preferences.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                    preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-600" />
                <span className="font-medium">Voice Caller (B-7, I-22...)</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ voiceCallerEnabled: !preferences.voiceCallerEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  preferences.voiceCallerEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-xs ${
                    preferences.voiceCallerEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Grid Layout Configuration */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-1.5">Card Grid Columns</h4>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => onUpdatePreferences({ gridColumns: cols })}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition cursor-pointer ${
                    preferences.gridColumns === cols
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cols} {cols === 1 ? 'Column' : 'Columns'}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Cards By */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-1.5">Sort Cards By</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'id', label: 'Card ID' },
                { id: 'recent', label: 'Recently Created' },
                { id: 'registration', label: 'Registered First' },
                { id: 'marked', label: 'Most Marked Cells' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdatePreferences({ sortBy: s.id as any })}
                  className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition cursor-pointer text-left ${
                    preferences.sortBy === s.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Markings */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all manually marked numbers on your cards? Center FREE spaces will stay covered.')) {
                  onClearMarkedNumbers();
                  onClose();
                }
              }}
              className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>Clear Marked Numbers on My Cards</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
