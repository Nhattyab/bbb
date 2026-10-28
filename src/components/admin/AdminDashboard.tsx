import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Settings,
  PlaySquare,
  Users,
  AlertTriangle,
  Trophy,
  History,
  Shield,
  FileText,
  Menu,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Power,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import {
  GameSession,
  User,
  BingoCard,
  BingoClaim,
  Winner,
  AuditLogEntry,
  HistoricalGame,
  SystemSettings,
  AdminNavigationTab,
} from '../../types/bingo';
import { OverviewTab } from './OverviewTab';
import { GameSetupTab } from './GameSetupTab';
import { LiveGameControlTab } from './LiveGameControlTab';
import { PlayersCardsTab } from './PlayersCardsTab';
import { ClaimsMonitoringTab } from './ClaimsMonitoringTab';
import { WinnersResultsTab } from './WinnersResultsTab';
import { GameHistoryTab } from './GameHistoryTab';
import { SettingsPermissionsTab } from './SettingsPermissionsTab';
import { AuditLogsTab } from './AuditLogsTab';
import { CardInspectModal } from './CardInspectModal';
import { BlockCardModal } from './BlockCardModal';
import { GameRecapModal } from './GameRecapModal';
import { CertificateExportModal } from './CertificateExportModal';
import { WinnerCardModal } from '../WinnerCardModal';

interface AdminDashboardProps {
  currentUser: User | null;
  game: GameSession | null;
  countdownSeconds: number;
  claimWindowSeconds: number;
  onReturnToPlayerApp: () => void;
  onSwitchUser: (userId: string) => void;
  onRefreshGame: () => void;
  onLogout?: () => void;
}

export function AdminDashboard({
  currentUser,
  game,
  countdownSeconds,
  claimWindowSeconds,
  onReturnToPlayerApp,
  onSwitchUser,
  onRefreshGame,
  onLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminNavigationTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [serviceActionLoading, setServiceActionLoading] = useState(false);

  // Data Collections for Admin
  const [cards, setCards] = useState<
    (BingoCard & {
      ownerName?: string;
      ownerUsername?: string;
      markedCount?: number;
      markedPercentage?: number;
    })[]
  >([]);
  const [players, setPlayers] = useState<
    (User & {
      cardsCount?: number;
      registeredCardsCount?: number;
      blockedCardsCount?: number;
    })[]
  >([]);
  const [claims, setClaims] = useState<
    (BingoClaim & {
      cardMatrix?: (number | 'FREE')[][];
      cardMarked?: boolean[][];
      isCardBlocked?: boolean;
    })[]
  >([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [history, setHistory] = useState<HistoricalGame[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    defaultAutoCallInterval: 7,
    maxCardsPerPlayer: 10,
    claimWindowDurationSeconds: 15,
    countdownDurationSeconds: 15,
    autoCallInitialDelaySeconds: 5,
    defaultPrizeAmount: 150.0,
    defaultEntryPrice: 1.0,
    requireManualClaimVerification: false,
    autoBlockFalseClaims: true,
    announcementsEnabled: true,
    maintenanceMode: false,
  });

  // Active Modals
  const [inspectingCard, setInspectingCard] = useState<BingoCard | null>(null);
  const [blockingCardId, setBlockingCardId] = useState<string | null>(null);
  const [recapGame, setRecapGame] = useState<HistoricalGame | null>(null);
  const [certWinner, setCertWinner] = useState<Winner | null>(null);
  const [inspectingWinner, setInspectingWinner] = useState<Winner | null>(null);

  // Fetch admin resources
  const fetchAllAdminData = async () => {
    try {
      const headers = { 'x-user-id': currentUser?.id || 'usr-host-1' };

      const [cardsRes, playersRes, claimsRes, logsRes, histRes, settingsRes] = await Promise.all([
        fetch('/api/admin/cards', { headers }),
        fetch('/api/admin/players', { headers }),
        fetch('/api/admin/claims', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
        fetch('/api/admin/history', { headers }),
        fetch('/api/admin/settings', { headers }),
      ]);

      if (cardsRes.ok) setCards(await cardsRes.json());
      if (playersRes.ok) setPlayers(await playersRes.json());
      if (claimsRes.ok) setClaims(await claimsRes.json());
      if (logsRes.ok) setAuditLogs(await logsRes.json());
      if (histRes.ok) setHistory(await histRes.json());
      if (settingsRes.ok) setSystemSettings(await settingsRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
    const interval = setInterval(fetchAllAdminData, 6000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // REQUIREMENT 7: Global Stop Bingo Action
  const handleStopBingoService = async () => {
    if (!window.confirm('STOP BINGO: This will immediately suspend all game activities platform-wide and notify all connected players. Proceed?')) {
      return;
    }
    setServiceActionLoading(true);
    try {
      const res = await fetch('/api/admin/service/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      }
    } catch (err) {
      console.error('Failed to stop service:', err);
    } finally {
      setServiceActionLoading(false);
    }
  };

  // REQUIREMENT 7: Global Start Bingo Action
  const handleStartBingoService = async () => {
    if (!window.confirm('START BINGO: This will restore game services, notify players, and clean the current-game card area for a fresh tournament round. Proceed?')) {
      return;
    }
    setServiceActionLoading(true);
    try {
      const res = await fetch('/api/admin/service/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      }
    } catch (err) {
      console.error('Failed to start service:', err);
    } finally {
      setServiceActionLoading(false);
    }
  };

  // Standard Game Lifecycle Handlers
  const handleStartGame = async () => {
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
        body: JSON.stringify({ userId: currentUser?.id, forceRestart: true }),
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to start game.');
      }
    } catch {
      alert('Network failure starting game.');
    }
  };

  const handlePauseGame = async () => {
    try {
      const res = await fetch('/api/game/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      }
    } catch {
      alert('Failed to pause game.');
    }
  };

  const handleResumeGame = async () => {
    try {
      const res = await fetch('/api/game/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      }
    } catch {
      alert('Failed to resume game.');
    }
  };

  const handleCallNumber = async (num?: number) => {
    try {
      const res = await fetch('/api/game/call-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
        body: JSON.stringify({ number: num }),
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to call number.');
      }
    } catch {
      alert('Network error calling number.');
    }
  };

  const handleToggleAutoCall = async (active: boolean) => {
    try {
      const res = await fetch('/api/game/auto-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
        body: JSON.stringify({ active, intervalSeconds: game?.autoCallIntervalSeconds || 7 }),
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      }
    } catch {
      alert('Failed to toggle auto caller.');
    }
  };

  const handleToggleRegistration = async (open: boolean) => {
    try {
      const res = await fetch('/api/game/registration/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
        body: JSON.stringify({ open }),
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      }
    } catch {
      alert('Failed to toggle registration.');
    }
  };

  const handleCancelGame = async () => {
    if (!window.confirm('Are you sure you want to cancel this championship game?')) return;
    try {
      const res = await fetch('/api/game/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      }
    } catch {
      alert('Failed to cancel game.');
    }
  };

  const handleResetGame = async (config?: any) => {
    if (!window.confirm('Reset this game session and start fresh for registration?')) return;
    try {
      const res = await fetch('/api/game/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-host-1',
        },
        body: JSON.stringify(config || {}),
      });
      if (res.ok) {
        onRefreshGame();
        fetchAllAdminData();
      }
    } catch {
      alert('Failed to reset game.');
    }
  };

  const handleSaveSetup = async (params: any) => {
    const res = await fetch('/api/game/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser?.id || 'usr-host-1',
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save setup.');
    }
    onRefreshGame();
    fetchAllAdminData();
  };

  const handleBlockCard = async (cardId: string, reason: string) => {
    const res = await fetch('/api/game/block-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser?.id || 'usr-host-1',
      },
      body: JSON.stringify({ cardId, reason }),
    });
    if (res.ok) {
      onRefreshGame();
      fetchAllAdminData();
    }
  };

  const handleUnblockCard = async (cardId: string) => {
    const res = await fetch('/api/game/unblock-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser?.id || 'usr-host-1',
      },
      body: JSON.stringify({ cardId }),
    });
    if (res.ok) {
      onRefreshGame();
      fetchAllAdminData();
    }
  };

  const handleResolveClaim = async (claimId: string, action: 'confirm' | 'reject', reason?: string) => {
    const res = await fetch('/api/admin/claims/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser?.id || 'usr-host-1',
      },
      body: JSON.stringify({ claimId, action, reason }),
    });
    if (res.ok) {
      onRefreshGame();
      fetchAllAdminData();
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser?.id || 'usr-host-1',
      },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      fetchAllAdminData();
    }
  };

  const isSuspended = Boolean(game?.isServiceSuspended);
  const pendingClaimsCount = claims.filter((c) => c.status === 'submitted' || c.status === 'under_verification').length;
  const registeredCardsCount = cards.filter((c) => c.isRegistered && !c.isBlocked).length;

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'setup', label: 'Game Setup', icon: Settings },
    { id: 'live-control', label: 'Live Game Control', icon: PlaySquare, isLive: game?.status === 'in_progress' },
    { id: 'players-cards', label: 'Players & Cards', icon: Users, badge: cards.length },
    { id: 'claims', label: 'Claims & Monitoring', icon: AlertTriangle, alertBadge: pendingClaimsCount },
    { id: 'winners', label: 'Winners & Results', icon: Trophy, badge: game?.winners?.length || 0 },
    { id: 'history', label: 'Game History & Reports', icon: History },
  ];

  const adminNavItems = [
    { id: 'settings', label: 'Settings & Host Permissions', icon: Shield },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  const renderNavContent = () => (
    <div className="flex flex-col h-full bg-[#14213D] text-slate-300">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-xs">
            B
          </div>
          {!isSidebarCollapsed && (
            <div>
              <h1 className="font-extrabold text-white text-sm tracking-tight leading-tight">
                10:20 BINGO
              </h1>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase block">
                Control Panel
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto admin-scrollbar p-3 space-y-6">
        <div>
          {!isSidebarCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Operations
            </span>
          )}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as AdminNavigationTab);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex items-center gap-1.5">
                      {item.isLive && (
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      )}
                      {item.alertBadge !== undefined && item.alertBadge > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                          {item.alertBadge}
                        </span>
                      )}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 font-bold text-[10px]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          {!isSidebarCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Administration
            </span>
          )}
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as AdminNavigationTab);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Switch to Player App and Logout Buttons */}
      <div className="p-3 border-t border-slate-700/60 space-y-2">
        <button
          onClick={onReturnToPlayerApp}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {!isSidebarCollapsed && <span>View Player App</span>}
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="Sign out of administrative account"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col antialiased text-[#1E293B]">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-xs h-full z-10 shadow-2xl">
            {renderNavContent()}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 transition-all duration-200 border-r border-slate-700/40 z-20 ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {renderNavContent()}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navigation Bar with Global Start/Stop Bingo Controls */}
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 z-10 shrink-0">
            {/* Left: Mobile Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-slate-400">Admin Console</span>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {activeTab.replace(/-/g, ' ')}
                </span>
              </div>
            </div>

            {/* Center: REQUIREMENT 7 Global Start / Stop Bingo Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isSuspended ? (
                <button
                  type="button"
                  disabled={serviceActionLoading}
                  onClick={handleStartBingoService}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  title="Restore Bingo platform services"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>START BINGO</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={serviceActionLoading}
                  onClick={handleStopBingoService}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  title="Suspend Bingo platform activities"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>STOP BINGO</span>
                </button>
              )}

              {/* Status Pill */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSuspended
                      ? 'bg-rose-500 animate-pulse'
                      : game?.status === 'in_progress'
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="font-semibold text-slate-800 uppercase tracking-wide text-[10px]">
                  {isSuspended ? 'SERVICE SUSPENDED' : game?.status?.replace(/_/g, ' ') || 'READY'}
                </span>
              </div>
            </div>

            {/* Right: Switcher, Return to Player App & Sign Out */}
            <div className="flex items-center gap-2">
              <button
                onClick={onReturnToPlayerApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Player View</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  title="Sign out of administrative account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </header>

          {/* Suspended Warning Banner */}
          {isSuspended && (
            <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                <span>Bingo Platform Suspended: No gameplay, registrations, or claims are currently permitted.</span>
              </div>
              <button
                type="button"
                onClick={handleStartBingoService}
                className="px-2.5 py-0.5 bg-white text-rose-700 hover:bg-rose-50 rounded text-[11px] font-black cursor-pointer uppercase"
              >
                Resume Service
              </button>
            </div>
          )}

          {/* Tab Viewport */}
          <main className="flex-1 overflow-y-auto admin-scrollbar p-4 sm:p-6 lg:p-8">
            {activeTab === 'overview' && (
              <OverviewTab
                game={game}
                auditLogs={auditLogs}
                registeredCardsCount={registeredCardsCount}
                totalCardsCount={cards.length}
                pendingClaimsCount={pendingClaimsCount}
                onNavigate={(t) => setActiveTab(t)}
                onStartGame={handleStartGame}
                onPauseGame={handlePauseGame}
                onResumeGame={handleResumeGame}
                onCallNumber={() => handleCallNumber()}
                onToggleAutoCall={handleToggleAutoCall}
                onToggleRegistration={handleToggleRegistration}
                onResetGame={() => handleResetGame()}
                countdownSeconds={countdownSeconds}
                claimWindowSeconds={claimWindowSeconds}
              />
            )}

            {activeTab === 'setup' && (
              <GameSetupTab
                game={game}
                onSaveSetup={handleSaveSetup}
                onResetGame={handleResetGame}
              />
            )}

            {activeTab === 'live-control' && (
              <LiveGameControlTab
                game={game}
                countdownSeconds={countdownSeconds}
                claimWindowSeconds={claimWindowSeconds}
                onStartGame={handleStartGame}
                onPauseGame={handlePauseGame}
                onResumeGame={handleResumeGame}
                onCallNumber={handleCallNumber}
                onToggleAutoCall={handleToggleAutoCall}
                onCancelGame={handleCancelGame}
                onResetGame={handleResetGame}
              />
            )}

            {activeTab === 'players-cards' && (
              <PlayersCardsTab
                players={players}
                cards={cards}
                onInspectCard={(card) => setInspectingCard(card)}
                onBlockCard={(cardId) => setBlockingCardId(cardId)}
                onUnblockCard={handleUnblockCard}
                onRefresh={fetchAllAdminData}
              />
            )}

            {activeTab === 'claims' && (
              <ClaimsMonitoringTab
                claims={claims}
                game={game}
                onResolveClaim={handleResolveClaim}
                onInspectCard={(cardId) => {
                  const card = cards.find((c) => c.id === cardId);
                  if (card) setInspectingCard(card);
                }}
              />
            )}

            {activeTab === 'winners' && (
              <WinnersResultsTab
                winners={game?.winners || []}
                totalPrizePool={game?.totalPrizePool || 0}
                onInspectWinnerCard={(w) => setInspectingWinner(w)}
                onExportCertificate={(w) => setCertWinner(w)}
              />
            )}

            {activeTab === 'history' && (
              <GameHistoryTab
                history={history}
                onViewRecap={(h) => setRecapGame(h)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPermissionsTab
                settings={systemSettings}
                onUpdateSettings={handleUpdateSettings}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'audit-logs' && (
              <AuditLogsTab logs={auditLogs} />
            )}
          </main>
        </div>
      </div>

      {/* Admin Modals */}
      <CardInspectModal
        card={inspectingCard}
        calledNumbers={game?.calledNumbers || []}
        onClose={() => setInspectingCard(null)}
        onBlockCard={(cardId) => handleBlockCard(cardId, 'Administrative action')}
        onUnblockCard={(cardId) => handleUnblockCard(cardId)}
      />

      <BlockCardModal
        cardId={blockingCardId}
        isOpen={Boolean(blockingCardId)}
        onClose={() => setBlockingCardId(null)}
        onConfirmBlock={(cardId, reason) => {
          handleBlockCard(cardId, reason);
          setBlockingCardId(null);
        }}
      />

      <GameRecapModal
        game={recapGame}
        isOpen={Boolean(recapGame)}
        onClose={() => setRecapGame(null)}
      />

      <CertificateExportModal
        winner={certWinner}
        isOpen={Boolean(certWinner)}
        onClose={() => setCertWinner(null)}
      />

      <WinnerCardModal
        winner={inspectingWinner}
        onClose={() => setInspectingWinner(null)}
      />
    </div>
  );
}
