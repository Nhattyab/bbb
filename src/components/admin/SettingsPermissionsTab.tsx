import React, { useState } from 'react';
import { Shield, Save, CheckCircle2, Sliders, Bell, AlertTriangle } from 'lucide-react';
import { SystemSettings, User } from '../../types/bingo';

interface SettingsPermissionsTabProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  currentUser: User | null;
}

export function SettingsPermissionsTab({
  settings,
  onUpdateSettings,
  currentUser,
}: SettingsPermissionsTabProps) {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await onUpdateSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">System Configuration & Policies</h2>
          <p className="text-xs text-slate-500">Global gameplay timers, limits, and host administrative policies</p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gameplay Timings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Timings & Interval Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Default Auto-Call Interval (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="20"
                value={formData.defaultAutoCallInterval}
                onChange={(e) =>
                  setFormData({ ...formData, defaultAutoCallInterval: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Pace between ball draws (5 - 20s). Default: 7s.</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Max Cards Per Player
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.maxCardsPerPlayer}
                onChange={(e) =>
                  setFormData({ ...formData, maxCardsPerPlayer: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Maximum registered cards allowed per user session.</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Pre-Game Countdown Duration (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={formData.countdownDurationSeconds}
                onChange={(e) =>
                  setFormData({ ...formData, countdownDurationSeconds: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Official preparation timer before ball draws begin (15s).</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Winner Claim Window Duration (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="30"
                value={formData.claimWindowDurationSeconds}
                onChange={(e) =>
                  setFormData({ ...formData, claimWindowDurationSeconds: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Time window when a player claims Bingo (15s).</span>
            </div>
          </div>
        </div>

        {/* Security & Enforcement */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Security & Claim Verification Policies</h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={formData.autoBlockFalseClaims}
                onChange={(e) =>
                  setFormData({ ...formData, autoBlockFalseClaims: e.target.checked })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">Strict Auto-Block for Fraudulent Claims</span>
                <span className="text-slate-500 text-[11px]">
                  Automatically block any card that claims Bingo without meeting official verified numbers or winning patterns.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={formData.announcementsEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, announcementsEnabled: e.target.checked })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">Broadcast Live Announcements</span>
                <span className="text-slate-500 text-[11px]">
                  Deliver real-time text announcements and notifications to all active player dashboards.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
