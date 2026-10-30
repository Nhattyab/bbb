import React from 'react';
import { RotateCcw, RotateCw, Settings, Menu, ShieldAlert, Radio, Clock, Sparkles, Shield, LogIn } from 'lucide-react';
import { GameSession, User } from '../types/bingo';

interface HeaderProps {
  appName: string;
  user: User | null;
  game: GameSession | null;
  countdownSeconds?: number;
  claimWindowSeconds?: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenSettings: () => void;
  onOpenMenu: () => void;
  onOpenHostControls: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appName,
  user,
  game,
  countdownSeconds,
  claimWindowSeconds,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenSettings,
  onOpenMenu,
  onOpenHostControls,
  onOpenAuth,
}) => {
  // REQUIREMENT 6: Strictly check if user is an authorized host or admin
  const isHost = user?.role === 'host' || user?.role === 'admin';

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shadow-md select-none">
      <div className="max-w-4xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2">
        {/* Left: App Title and Live Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight truncate drop-shadow-xs font-sans uppercase">
                {appName || '10:20 BINGO'}
              </h1>
              {(game?.status === 'pre_game_countdown' || game?.status === 'starting_countdown') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-amber-950 uppercase tracking-wider animate-pulse shadow-xs">
                  <Clock className="w-3 h-3" />
                  {countdownSeconds && countdownSeconds > 0 ? `Starts in ${countdownSeconds}s` : 'Starting Soon'}
                </span>
              )}
              {game?.claimWindowActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-purple-300 text-purple-950 uppercase tracking-wider animate-pulse shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  {claimWindowSeconds && claimWindowSeconds > 0 ? `Claim: ${claimWindowSeconds}s` : 'Claim Window'}
                </span>
              )}
              {game?.autoCallActive && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-emerald-950 uppercase tracking-wider animate-pulse">
                  <Radio className="w-2.5 h-2.5" />
                  Auto
                </span>
              )}
            </div>
            <span className="text-[11px] text-blue-200 font-medium truncate">
              {game?.title || '75-Ball Classic Game'}
            </span>
          </div>
        </div>

        {/* Center / Right: Control Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Undo Button */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title={canUndo ? 'Undo last card marking' : 'Nothing to undo'}
            aria-label="Undo"
            className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg transition-colors ${
              canUndo
                ? 'text-white hover:bg-white/20 active:bg-white/30 cursor-pointer'
                : 'text-white/35 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Redo Button */}
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title={canRedo ? 'Redo action' : 'Nothing to redo'}
            aria-label="Redo"
            className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg transition-colors ${
              canRedo
                ? 'text-white hover:bg-white/20 active:bg-white/30 cursor-pointer'
                : 'text-white/35 cursor-not-allowed'
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Application & Card Settings"
            aria-label="Settings"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-white hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* REQUIREMENT 6: Host Controls Trigger - ONLY visible if user is an authorized host or admin */}
          {isHost && (
            <button
              type="button"
              onClick={onOpenHostControls}
              title="Host & Admin Control Panel"
              aria-label="Host Controls"
              className="min-h-[38px] px-2.5 flex items-center gap-1 rounded-lg transition-colors bg-amber-500 text-slate-950 font-bold text-xs border border-amber-300 hover:bg-amber-400 cursor-pointer shadow-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}

          {/* Sign In button when signed out */}
          {!user && (
            <button
              type="button"
              onClick={onOpenAuth}
              title="Sign In or Switch Account"
              className="min-h-[38px] px-3 flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-xs transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Hamburger Menu Button */}
          <button
            type="button"
            onClick={onOpenMenu}
            title="Open Menu"
            aria-label="Open Navigation Menu"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-white hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
