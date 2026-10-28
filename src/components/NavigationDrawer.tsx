import React from 'react';
import {
  X,
  Home,
  Layers,
  BookOpen,
  History,
  Archive,
  User as UserIcon,
  Settings,
  HelpCircle,
  Bell,
  LogOut,
  LogIn,
  Shield,
} from 'lucide-react';
import { User } from '../types/bingo';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: string;
  onNavigate: (item: string) => void;
  user: User | null;
  onLogout: () => void;
  onOpenSavedCards: () => void;
  onOpenHostDashboard?: () => void;
  onOpenAuth: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeItem,
  onNavigate,
  user,
  onLogout,
  onOpenSavedCards,
  onOpenHostDashboard,
  onOpenAuth,
}) => {
  if (!isOpen) return null;

  const isHost = user?.role === 'host' || user?.role === 'admin';

  const navLinks = [
    { id: 'game', label: 'Home / Game', icon: Home },
    { id: 'cards', label: 'My Bingo Cards', icon: Layers },
    { id: 'rules', label: 'Game Rules', icon: BookOpen },
    { id: 'saved_cards', label: 'Saved Cards History', icon: Archive, onClick: onOpenSavedCards },
    { id: 'history', label: 'Game History', icon: History },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'help', label: 'Help and Support', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-lg text-white">
              75
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight">10:20 BINGO</div>
              <div className="text-[11px] text-blue-200">Tournament Edition</div>
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

        {/* User Account Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-2">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate">
                  {user.displayName}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isHost
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                {user.role === 'admin' ? 'Admin' : isHost ? 'Host' : 'Player'}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-700 text-xs">Not Signed In</div>
                <div className="text-[11px] text-slate-400">Guest mode</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-2xs cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Host & Admin Panel Entry: ONLY for authorized Host or Admin */}
          {isHost && onOpenHostDashboard && (
            <button
              type="button"
              onClick={() => {
                onOpenHostDashboard();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-950 bg-amber-100 border border-amber-300 hover:bg-amber-200 shadow-2xs transition-all cursor-pointer mb-2"
            >
              <Shield className="w-4 h-4 text-amber-700" />
              <span>Admin & Host Control Panel</span>
            </button>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeItem === link.id;

            return (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  if (link.onClick) {
                    link.onClick();
                  } else {
                    onNavigate(link.id);
                  }
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Logout / Login */}
        <div className="p-3 border-t border-slate-100">
          {user ? (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Switch Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
