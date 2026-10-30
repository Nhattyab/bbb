import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Lock,
  AlertCircle,
  CheckCircle,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { GameSession, WinningPattern } from '../../types/bingo';
import { WINNING_RULE_LABELS } from '../../utils/bingoRules';

interface GameSetupTabProps {
  game: GameSession | null;
  onSaveSetup: (setup: any) => Promise<void>;
  onResetGame: (config?: any) => Promise<void>;
  onOpenRegistration?: () => Promise<void>;
  onCloseRegistration?: () => Promise<void>;
}

export function GameSetupTab({
  game,
  onSaveSetup,
  onResetGame,
  onOpenRegistration,
  onCloseRegistration,
}: GameSetupTabProps) {
  const [title, setTitle] = useState(game?.title || '10:20 BINGO Championship');
  const [gameCode, setGameCode] = useState(game?.gameCode || '10:20-BINGO-101');
  const [activeRule, setActiveRule] = useState<WinningPattern>(
    game?.activeWinningRule && game.activeWinningRule !== 'not_set'
      ? game.activeWinningRule
      : 'horizontal_line'
  );
  const [entryPrice, setEntryPrice] = useState(game?.entryPrice?.toString() || '1.00');
  const [individualPrize, setIndividualPrize] = useState(
    game?.individualPrize ? game.individualPrize.toString() : '150.00'
  );
  const [prizePool, setPrizePool] = useState(
    game?.totalPrizePool ? game.totalPrizePool.toString() : '150.00'
  );
  const [interval, setInterval] = useState(game?.autoCallIntervalSeconds?.toString() || '7');
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  useEffect(() => {
    if (game) {
      if (game.title) setTitle(game.title);
      if (game.gameCode) setGameCode(game.gameCode);
      if (game.activeWinningRule && game.activeWinningRule !== 'not_set') {
        setActiveRule(game.activeWinningRule);
      }
      if (game.entryPrice !== undefined) setEntryPrice(game.entryPrice.toString());
      if (game.individualPrize !== undefined) setIndividualPrize(game.individualPrize.toString());
      if (game.totalPrizePool !== undefined) setPrizePool(game.totalPrizePool.toString());
      if (game.autoCallIntervalSeconds !== undefined) setInterval(game.autoCallIntervalSeconds.toString());
    }
  }, [game]);

  // Lock configuration once registration opens, during gameplay, or until explicitly reset
  const isLocked = Boolean(
    game?.isRuleLocked || (game && game.status !== 'next_game' && game.status !== 'setup')
  );

  const isFormConfigured = Boolean(
    activeRule !== 'not_set' &&
    title.trim() &&
    gameCode.trim() &&
    parseFloat(prizePool) > 0
  );

  const isConfigured = Boolean(
    isFormConfigured || (
      game &&
      game.activeWinningRule !== 'not_set' &&
      game.title &&
      game.gameCode &&
      game.totalPrizePool > 0
    )
  );

  const isPlayActive =
    game?.status === 'starting_countdown' ||
    game?.status === 'pre_game_countdown' ||
    game?.status === 'running' ||
    game?.status === 'in_progress' ||
    game?.status === 'claim_review';

  const canOpenRegistration = Boolean(
    isConfigured && !game?.registrationOpen && !isPlayActive
  );

  const canCloseRegistration = Boolean(
    game?.registrationOpen
  );

  const handleOpenRegistrationClick = async () => {
    setMessage(null);
    if (!isConfigured) {
      setMessage({
        text: 'Registration can open only after the game has been configured correctly. Please configure and save title, game code, winning rule, and prize pool first.',
        type: 'error',
      });
      return;
    }

    if (!onOpenRegistration) return;
    setActionLoading(true);
    try {
      // Auto-save form if not already locked
      if (!isLocked) {
        await onSaveSetup({
          title: title.trim(),
          gameCode: gameCode.trim().toUpperCase(),
          activeWinningRule: activeRule,
          individualPrize: parseFloat(individualPrize) || parseFloat(prizePool) || 0,
          totalPrizePool: parseFloat(prizePool) || 0,
          entryPrice: parseFloat(entryPrice) || 0,
          autoCallIntervalSeconds: parseInt(interval, 10) || 7,
        });
      }
      await onOpenRegistration();
      setMessage({
        text: `Registration opened successfully for ${gameCode}! Card registration is now active and game configuration is locked.`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to open registration.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseRegistrationClick = async () => {
    setMessage(null);
    if (!onCloseRegistration) return;
    setActionLoading(true);
    try {
      await onCloseRegistration();
      setMessage({
        text: `Registration closed successfully for ${gameCode}. Players can no longer register cards. Ready to start game.`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to close registration.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAuthorizedCorrectionReset = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await onResetGame({
        reason: 'Authorized host rule correction before tournament start',
        skipConfirm: true,
      });
      setMessage({
        text: 'Game configuration has been reset and unlocked. Registration is closed. Please update settings and save before reopening registration.',
        type: 'warning',
      });
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to reset configuration.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setMessage({
        text: 'Game setup is locked because registration has opened.',
        type: 'error',
      });
      return;
    }

    if (!title.trim()) {
      setMessage({ text: 'Game title is required.', type: 'error' });
      return;
    }
    if (!gameCode.trim()) {
      setMessage({ text: 'Unique game code is required.', type: 'error' });
      return;
    }
    if (!activeRule || activeRule === 'not_set') {
      setMessage({ text: 'Please select a winning rule.', type: 'error' });
      return;
    }

    const totalNum = parseFloat(prizePool);
    if (isNaN(totalNum) || totalNum <= 0) {
      setMessage({ text: 'Total prize pool must be greater than 0.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await onSaveSetup({
        title: title.trim(),
        gameCode: gameCode.trim().toUpperCase(),
        activeWinningRule: activeRule,
        individualPrize: parseFloat(individualPrize) || totalNum,
        totalPrizePool: totalNum,
        entryPrice: parseFloat(entryPrice) || 0,
        autoCallIntervalSeconds: parseInt(interval, 10) || 7,
      });
      setMessage({
        text: 'Championship game configured successfully! Click "Open Registration" to start accepting cards.',
        type: 'success',
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save configuration.', type: 'error' });
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
    <div className="max-w-3xl space-y-6">
      {/* 1. REGISTRATION CONTROLS CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Registration Controls</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  game?.registrationOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {game?.registrationOpen ? 'Registration: OPEN' : 'Registration: CLOSED'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Registration can open only after the game has been configured correctly. Closing registration prevents all new registrations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Open Registration Button */}
            <button
              type="button"
              disabled={actionLoading || !canOpenRegistration}
              onClick={handleOpenRegistrationClick}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs ${
                canOpenRegistration
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={
                !isConfigured
                  ? 'Registration can open only after the game has been configured correctly.'
                  : game?.registrationOpen
                  ? 'Registration is already open.'
                  : 'Open Registration'
              }
            >
              <DoorOpen className="w-4 h-4" />
              <span>Open Registration</span>
            </button>

            {/* Close Registration Button */}
            <button
              type="button"
              disabled={actionLoading || !canCloseRegistration}
              onClick={handleCloseRegistrationClick}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs ${
                canCloseRegistration
                  ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={
                !game?.registrationOpen
                  ? 'Registration is already closed.'
                  : 'Close Registration'
              }
            >
              <DoorClosed className="w-4 h-4" />
              <span>Close Registration</span>
            </button>
          </div>
        </div>

        {/* State Notice Pill */}
        <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <span>
            Current Status:{' '}
            <strong className="text-slate-900 uppercase font-mono">
              {game?.status ? game.status.replace(/_/g, ' ') : 'UNKNOWN'}
            </strong>{' '}
            · Registered Cards:{' '}
            <strong className="text-slate-900 font-mono">
              {game?.registeredPlayersCount ?? 0}
            </strong>
          </span>
          {game?.registrationOpen ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Eligible players may register cards
            </span>
          ) : (
            <span className="text-slate-500">New card registrations are blocked</span>
          )}
        </div>
      </div>

      {/* 2. GAME SETUP & LOCK PANEL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-base text-slate-900">Game Configuration</h3>
          {isLocked ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Configuration Locked</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Editable (Pre-Registration)
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Configure game title, unique code, winning rule, separate individual prize, and total prize pool before opening registration.
        </p>

        {/* MANDATORY EXACT LOCK MESSAGE DISPLAY */}
        {isLocked && (
          <div className="mb-5 p-4 bg-amber-50 rounded-xl border border-amber-300 flex items-start justify-between gap-3 text-xs text-amber-950 shadow-2xs">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-amber-900">
                  Game setup is locked because registration has opened.
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  The game code, winning pattern, individual prize, and total prize pool are locked to guarantee fair competition. Direct modifications are blocked on both frontend and backend.
                </p>
              </div>
            </div>

            {/* Authorized, auditable cancellation / reset for rule correction */}
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleAuthorizedCorrectionReset}
              className="shrink-0 px-3 py-1.5 bg-white text-amber-900 hover:bg-amber-100 border border-amber-300 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              title="Reset game configuration for rule correction (audited)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>Cancel & Reset for Correction</span>
            </button>
          </div>
        )}

        {message && (
          <div
            className={`mb-5 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : message.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : message.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Championship Title</label>
              <input
                type="text"
                disabled={isLocked}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="e.g. 10:20 BINGO Championship"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Unique Game Code</label>
              <input
                type="text"
                disabled={isLocked}
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="e.g. 10:20-BINGO-442"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1.5">
              Active Winning Rule (Strict 1-Rule Tournament)
            </label>
            <div className="space-y-2">
              {rules.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                    isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                  } ${
                    activeRule === r.id
                      ? 'bg-blue-50/70 border-blue-400 text-blue-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rule"
                    disabled={isLocked}
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

          {/* Individual Prize and Total Prize Pool as Separate Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Individual Prize ($)</label>
              <input
                type="number"
                step="5"
                min="0"
                disabled={isLocked}
                value={individualPrize}
                onChange={(e) => setIndividualPrize(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Per-winner payout</span>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Total Prize Pool ($)</label>
              <input
                type="number"
                step="5"
                min="1"
                disabled={isLocked}
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Entire tournament pool</span>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                disabled={isLocked}
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Card purchase cost</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Auto-Call Interval (Seconds)</label>
            <input
              type="number"
              min="5"
              max="15"
              disabled={isLocked}
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              disabled={isLocked || actionLoading}
              onClick={() => onResetGame()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to Defaults
            </button>

            <button
              type="submit"
              disabled={saving || isLocked || actionLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
