import React, { useState } from 'react';
import { X, User, Lock, Mail, Shield, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types/bingo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleQuickLogin = async (presetUser: 'admin' | 'host' | 'player') => {
    setError(null);
    setLoading(true);
    let targetUsername = 'admin_bob';
    let targetPass = 'admin123';
    if (presetUser === 'host') {
      targetUsername = 'host_alice';
      targetPass = 'host123';
    } else if (presetUser === 'player') {
      targetUsername = 'lucky_player';
      targetPass = 'player123';
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername, password: targetPass }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed.');
      }
      onSuccess(data.user, data.token);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? { username, email, displayName: username, role: 'player' }
        : { username: username || email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed.');
      }

      onSuccess(data.user, data.token);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {isRegister ? 'Create Player Account' : 'Sign In / Switch Account'}
              </h3>
              <p className="text-[11px] text-indigo-100">10:20 BINGO Championship</p>
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

        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
          {/* Quick Demo Logins Box with Admin Credentials Highlighted */}
          <div className="p-3.5 bg-gradient-to-b from-slate-50 to-indigo-50/40 rounded-2xl border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo Accounts (Instant 1-Click Login)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Admin Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('admin')}
                className="w-full p-2.5 bg-white hover:bg-amber-50/80 active:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-xl text-left transition cursor-pointer flex items-center justify-between shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                    👑
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Admin Bob</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded border border-amber-200 uppercase">
                        Super Admin
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Username: <strong className="text-slate-800">admin_bob</strong> · Pass: <strong className="text-slate-800">admin123</strong>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-700 group-hover:underline">
                  Sign In →
                </span>
              </button>

              {/* Host Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('host')}
                className="w-full p-2.5 bg-white hover:bg-blue-50/80 active:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-xl text-left transition cursor-pointer flex items-center justify-between shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                    🎙️
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Host Alice</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded border border-blue-200 uppercase">
                        Host
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Username: <strong className="text-slate-800">host_alice</strong> · Pass: <strong className="text-slate-800">host123</strong>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-700 group-hover:underline">
                  Sign In →
                </span>
              </button>

              {/* Player Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('player')}
                className="w-full p-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl text-left transition cursor-pointer flex items-center justify-between shadow-2xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                    🎯
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Lucky Player</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded border border-emerald-200 uppercase">
                        Player
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Username: <strong className="text-slate-800">lucky_player</strong> · Pass: <strong className="text-slate-800">player123</strong>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 group-hover:underline">
                  Sign In →
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 my-2">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-semibold uppercase tracking-wider">or sign in manually</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* Manual Login / Register Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="font-bold text-slate-900 block mb-1">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin_bob or host_alice"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-indigo-600 transition"
              />
            </div>

            {isRegister && (
              <div>
                <label className="font-bold text-slate-900 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@bingo.app"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-indigo-600 transition"
                />
              </div>
            )}

            <div>
              <label className="font-bold text-slate-900 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 4 characters"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-indigo-600 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register Player' : 'Sign In'}
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                {isRegister ? 'Already have an account? Sign In' : 'Need a new account? Register as New Player'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
