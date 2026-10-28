import React from 'react';
import { X, User as UserIcon, Trophy, Layers, Award, Wallet, Shield } from 'lucide-react';
import { User } from '../types/bingo';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">User Profile</h2>
              <p className="text-xs text-indigo-100">Account status and career statistics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* User ID & Role Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{user.displayName}</h3>
                <p className="text-slate-500 font-mono text-[11px]">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : user.role === 'host'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    Role: {user.role}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {user.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance / Credits */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-emerald-800">Account Balance</div>
                <div className="text-lg font-black font-mono text-emerald-950">
                  ${user.balance.toFixed(2)}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
              Demo Balance
            </span>
          </div>

          {/* Career Stats */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-2">Lifetime Statistics</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <div className="text-lg font-black font-mono text-slate-900">{user.stats?.bingosWon ?? 0}</div>
                <div className="text-[10px] text-slate-500 font-medium">Bingos Won</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <Layers className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <div className="text-lg font-black font-mono text-slate-900">{user.stats?.gamesPlayed ?? 0}</div>
                <div className="text-[10px] text-slate-500 font-medium">Games Played</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <Award className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-black font-mono text-slate-900">{user.stats?.cardsPlayed ?? 0}</div>
                <div className="text-[10px] text-slate-500 font-medium">Cards Played</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
