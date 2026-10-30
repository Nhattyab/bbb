import React, { useState, useEffect, useRef } from 'react';
import {
  GameSession,
  BingoCard,
  BingoBall,
  User,
  UserPreferences,
  LocalUndoAction,
  Winner,
} from './types/bingo';
import { soundManager } from './utils/audio';
import { Header } from './components/Header';
import { CollapsibleGameInfo } from './components/CollapsibleGameInfo';
import { CalledNumbersHistory } from './components/CalledNumbersHistory';
import { LiveAnnouncements } from './components/LiveAnnouncements';
import { BingoCardView } from './components/BingoCardView';
import { CardGenerationModal } from './components/CardGenerationModal';
import { DeleteCardModal } from './components/DeleteCardModal';
import { CardInspectModal } from './components/CardInspectModal';
import { WinnerCardModal } from './components/WinnerCardModal';
import { SettingsModal } from './components/SettingsModal';
import { NavigationDrawer } from './components/NavigationDrawer';
import { GameRulesModal } from './components/GameRulesModal';
import { GameHistoryModal } from './components/GameHistoryModal';
import { SavedCardsModal } from './components/SavedCardsModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { ClaimCelebrationModal } from './components/ClaimCelebrationModal';
import { NumberDetailModal } from './components/NumberDetailModal';
import { SplashScreen } from './components/SplashScreen';
import { HostControlsModal } from './components/HostControlsModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { WINNING_RULE_LABELS } from './utils/bingoRules';
import { Plus } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('bingo_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'usr-player-1',
      username: 'lucky_player',
      displayName: 'Lucky Player',
      email: 'player@bingo.app',
      role: 'player',
      balance: 100.0,
      stats: { gamesPlayed: 12, bingosWon: 3, cardsPlayed: 28 },
    };
  });

  const [game, setGame] = useState<GameSession | null>(null);
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [activeNavTab, setActiveNavTab] = useState<string>('game');
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  // Timers
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [claimWindowSeconds, setClaimWindowSeconds] = useState<number>(0);

  // Card operation states
  const [registeringCardId, setRegisteringCardId] = useState<string | null>(null);
  const [claimingCardId, setClaimingCardId] = useState<string | null>(null);
  const [registrationConflictError, setRegistrationConflictError] = useState<string | null>(null);

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<LocalUndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<LocalUndoAction[]>([]);

  // Preferences
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    soundEnabled: true,
    voiceCallerEnabled: true,
    vibrationEnabled: true,
    theme: 'light',
    customAppName: '10:20 BINGO',
    autoComplete: true, // Cross-card marking synchronization
    gridColumns: 2,
    sortBy: 'id',
    notificationsEnabled: true,
  });

  // Modal Dialogs
  const [isGenerateOpen, setIsGenerateOpen] = useState<boolean>(false);
  const [cardToDelete, setCardToDelete] = useState<BingoCard | null>(null);
  const [isDeletingCard, setIsDeletingCard] = useState<boolean>(false);
  const [inspectingCard, setInspectingCard] = useState<BingoCard | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSavedCardsOpen, setIsSavedCardsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [celebrationWinner, setCelebrationWinner] = useState<Winner | null>(null);
  const [selectedBallNumber, setSelectedBallNumber] = useState<number | null>(null);

  const prevBallCountRef = useRef<number>(0);

  // Centralized sign out handler
  const handleLogout = () => {
    try {
      localStorage.removeItem('bingo_user');
    } catch {}
    setCurrentUser(null);
    setCards([]);
    setShowAdminPanel(false);
    setIsMenuOpen(false);
    setIsSettingsOpen(false);
    setIsProfileOpen(false);
    setIsAuthOpen(true);
  };

  // Centralized sign in / switch account handler
  const handleLoginSuccess = (user: User) => {
    try {
      localStorage.setItem('bingo_user', JSON.stringify(user));
    } catch {}
    setCurrentUser(user);
    setIsAuthOpen(false);
    if (user.role === 'admin' || user.role === 'host') {
      setShowAdminPanel(true);
    }
  };

  // Fetch initial game state and cards
  const fetchGameAndCards = async () => {
    try {
      const gameRes = await fetch('/api/game/current');
      if (gameRes.ok) {
        const gameData: GameSession = await gameRes.json();
        setGame(gameData);

        // Sound trigger for newly called balls
        const newBallCount = gameData.calledNumbers?.length || 0;
        if (newBallCount > prevBallCountRef.current && prevBallCountRef.current > 0) {
          const latest = gameData.calledNumbers[newBallCount - 1];
          if (latest) {
            soundManager.playBallPop();
            soundManager.speakCall(latest.letter, latest.number);
          }
        }
        prevBallCountRef.current = newBallCount;
      }

      if (currentUser?.id) {
        const cardsRes = await fetch(`/api/game/cards?userId=${currentUser.id}`);
        if (cardsRes.ok) {
          const cardsData: BingoCard[] = await cardsRes.json();
          setCards((prevCards) => {
            if (!prevCards || prevCards.length === 0) return cardsData;
            return cardsData.map((newCard) => {
              const prev = prevCards.find((c) => c.id === newCard.id);
              if (!prev) return newCard;
              // Preserve client-marked numbers so changing settings never unmarks cells
              const mergedMarked = newCard.marked.map((row, r) =>
                row.map((cell, c) => (prev.marked?.[r]?.[c] ?? cell))
              );
              return { ...newCard, marked: mergedMarked };
            });
          });
        }
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error('Error fetching game/cards:', err);
    } finally {
      setLoading(false);
    }
  };

  // Only refetch on currentUser switch (not on sound/preference adjustments)
  useEffect(() => {
    fetchGameAndCards();
  }, [currentUser]);

  // Synchronize audio preferences without refetching cards or wiping local marks
  useEffect(() => {
    soundManager.setPreferences(
      userPreferences.soundEnabled,
      userPreferences.voiceCallerEnabled,
      userPreferences.vibrationEnabled
    );
  }, [userPreferences.soundEnabled, userPreferences.voiceCallerEnabled, userPreferences.vibrationEnabled]);

  // Server-Sent Events (SSE) Listener for Real-Time Updates
  useEffect(() => {
    let sse: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const setupSSE = () => {
      try {
        const url = `/api/game/events${currentUser?.id ? `?userId=${currentUser.id}` : ''}`;
        sse = new EventSource(url);

        const handleGameUpdate = (updatedGame: GameSession) => {
          if (!updatedGame) return;
          setGame(updatedGame);

          const newCount = updatedGame.calledNumbers?.length || 0;
          if (newCount > prevBallCountRef.current && prevBallCountRef.current > 0) {
            const latest = updatedGame.calledNumbers[newCount - 1];
            if (latest) {
              soundManager.playBallPop();
              soundManager.speakCall(latest.letter, latest.number);
            }
          }
          prevBallCountRef.current = newCount;
        };

        sse.addEventListener('INIT', (e: MessageEvent) => {
          try {
            const data: GameSession = JSON.parse(e.data);
            handleGameUpdate(data);
          } catch {}
        });

        sse.addEventListener('GAME_UPDATED', (e: MessageEvent) => {
          try {
            const data: GameSession = JSON.parse(e.data);
            handleGameUpdate(data);
          } catch (err) {
            console.error('SSE GAME_UPDATED parse error:', err);
          }
        });

        sse.addEventListener('NUMBER_CALLED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.game) {
              handleGameUpdate(data.game);
            } else if (data.ball) {
              setGame((prev) => {
                if (!prev) return prev;
                const exists = prev.calledNumbers.some((b) => b.number === data.ball.number);
                if (exists) return prev;
                return {
                  ...prev,
                  calledNumbers: [...prev.calledNumbers, data.ball],
                  currentNumber: data.ball,
                };
              });
              soundManager.playBallPop();
              soundManager.speakCall(data.ball.letter, data.ball.number);
            }
          } catch (err) {
            console.error('SSE NUMBER_CALLED parse error:', err);
          }
        });

        sse.addEventListener('PRE_GAME_COUNTDOWN', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.game) handleGameUpdate(data.game);
          } catch {}
        });

        sse.addEventListener('GAME_STARTED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.game) handleGameUpdate(data.game);
          } catch {}
        });

        sse.addEventListener('GAME_STOPPED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handleGameUpdate(data);
          } catch {}
        });

        sse.addEventListener('GAME_RESUMED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handleGameUpdate(data);
          } catch {}
        });

        sse.addEventListener('GAME_RESET', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handleGameUpdate(data);
            fetchGameAndCards();
          } catch {}
        });

        sse.addEventListener('GAME_TRANSITION_NEXT', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handleGameUpdate(data);
            fetchGameAndCards();
          } catch {}
        });

        sse.addEventListener('CLAIM_WINDOW_STARTED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.game) handleGameUpdate(data.game);
          } catch {}
        });

        sse.addEventListener('WINNER_VERIFIED_IN_WINDOW', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.game) handleGameUpdate(data.game);
          } catch {}
        });

        sse.addEventListener('GAME_COMPLETED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.game) handleGameUpdate(data.game);
          } catch {}
        });

        sse.addEventListener('BINGO_SERVICE_STOPPED', () => {
          setGame((prev) => (prev ? { ...prev, isServiceSuspended: true } : prev));
        });

        sse.addEventListener('BINGO_SERVICE_STARTED', () => {
          setGame((prev) => (prev ? { ...prev, isServiceSuspended: false } : prev));
          fetchGameAndCards();
        });

        sse.addEventListener('CARD_REGISTERED', (e: MessageEvent) => {
          try {
            const reg = JSON.parse(e.data);
            setCards((prev) =>
              prev.map((c) => (c.id === reg.cardId ? { ...c, isRegistered: true } : c))
            );
          } catch {}
        });

        sse.addEventListener('CARD_DELETED', (e: MessageEvent) => {
          try {
            const del = JSON.parse(e.data);
            if (del.cardId) {
              setCards((prev) => prev.filter((c) => c.id !== del.cardId));
            }
          } catch {}
        });

        sse.addEventListener('CARD_BLOCKED', (e: MessageEvent) => {
          try {
            const blk = JSON.parse(e.data);
            setCards((prev) =>
              prev.map((c) =>
                c.id === blk.cardId ? { ...c, isBlocked: true, blockReason: blk.reason } : c
              )
            );
          } catch {}
        });

        sse.addEventListener('WINNER_CONFIRMED', (e: MessageEvent) => {
          try {
            const winner: Winner = JSON.parse(e.data);
            soundManager.playWinFanfare();
            if (currentUser && winner.userId === currentUser.id) {
              setCelebrationWinner(winner);
            }
          } catch {}
        });

        sse.onerror = () => {
          if (sse) sse.close();
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              setupSSE();
            }, 2500);
          }
        };
      } catch (err) {
        console.error('SSE initialization error:', err);
      }
    };

    setupSSE();

    return () => {
      if (sse) sse.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [currentUser?.id]);

  // Timers countdown calculation (ticks every 250ms for smooth live updates)
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        (game?.status === 'starting_countdown' || game?.status === 'pre_game_countdown') &&
        game.countdownDeadline
      ) {
        const remaining = Math.max(0, Math.ceil((game.countdownDeadline - Date.now()) / 1000));
        setCountdownSeconds(remaining);
      } else {
        setCountdownSeconds(0);
      }

      if (game?.claimWindowActive && game.claimWindowDeadline) {
        const remaining = Math.max(0, Math.ceil((game.claimWindowDeadline - Date.now()) / 1000));
        setClaimWindowSeconds(remaining);
      } else {
        setClaimWindowSeconds(0);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [game]);

  // Fallback Polling Sync: Ensures live updates even if SSE is temporarily delayed
  useEffect(() => {
    const isLiveActive =
      game?.status === 'starting_countdown' ||
      game?.status === 'pre_game_countdown' ||
      game?.status === 'running' ||
      game?.status === 'in_progress' ||
      game?.status === 'claim_review' ||
      game?.status === 'checking_winners';

    const intervalTime = isLiveActive ? 1500 : 5000;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/game/current');
        if (res.ok) {
          const latestGame: GameSession = await res.json();
          setGame((prev) => {
            if (!prev) return latestGame;
            const ballsChanged = prev.calledNumbers?.length !== latestGame.calledNumbers?.length;
            const statusChanged = prev.status !== latestGame.status;
            const countdownChanged = prev.countdownDeadline !== latestGame.countdownDeadline;
            const claimChanged = prev.claimWindowActive !== latestGame.claimWindowActive;
            const winnersChanged = prev.winners?.length !== latestGame.winners?.length;
            const regChanged = prev.registrationOpen !== latestGame.registrationOpen;

            if (ballsChanged || statusChanged || countdownChanged || claimChanged || winnersChanged || regChanged) {
              const newCount = latestGame.calledNumbers?.length || 0;
              if (newCount > prevBallCountRef.current && prevBallCountRef.current > 0) {
                const latest = latestGame.calledNumbers[newCount - 1];
                if (latest) {
                  soundManager.playBallPop();
                  soundManager.speakCall(latest.letter, latest.number);
                }
              }
              prevBallCountRef.current = newCount;
              return latestGame;
            }
            return prev;
          });
        }
      } catch {
        // Silently ignore network hiccup
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [game?.status]);

  // REQUIREMENT 3: Delete Bingo Card handler
  const handleConfirmDeleteCard = async (cardId: string) => {
    setIsDeletingCard(true);
    try {
      const res = await fetch(`/api/game/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'usr-player-1',
        },
      });

      if (res.ok) {
        // Immediately remove card from current collection
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        // Remove from undo/redo stacks
        setUndoStack((prev) => prev.filter((act) => act.cardId !== cardId));
        setRedoStack((prev) => prev.filter((act) => act.cardId !== cardId));
        setCardToDelete(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete card.');
      }
    } catch {
      alert('Network failure while deleting card.');
    } finally {
      setIsDeletingCard(false);
    }
  };

  // REQUIREMENT 4 & Auto Complete (Cross-Card Marking Synchronization)
  const handleToggleMark = async (
    cardId: string,
    row: number,
    col: number,
    currentMarked: boolean
  ) => {
    if (game?.isServiceSuspended) return;

    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard || targetCard.isBlocked) return;

    const cellValue = targetCard.matrix[row][col];
    if (cellValue === 'FREE') return;

    const nextMarked = !currentMarked;
    const isNumberCalled =
      typeof cellValue === 'number' &&
      (game?.calledNumbers || []).some((b) => b.number === cellValue);

    soundManager.playDaub(nextMarked);

    // List of cards and cell coordinates to modify
    const targetCardsToUpdate: { cardId: string; row: number; col: number }[] = [
      { cardId, row, col },
    ];

    // If Auto Complete is ON, and number has been officially called,
    // find all other eligible cards owned by player with this same number
    if (userPreferences.autoComplete && nextMarked && isNumberCalled && typeof cellValue === 'number') {
      cards.forEach((otherCard) => {
        if (otherCard.id !== cardId && otherCard.userId === currentUser?.id && !otherCard.isBlocked) {
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (otherCard.matrix[r][c] === cellValue && !otherCard.marked[r][c]) {
                targetCardsToUpdate.push({ cardId: otherCard.id, row: r, col: c });
              }
            }
          }
        }
      });
    }

    // Apply updates locally
    setCards((prev) =>
      prev.map((card) => {
        const updates = targetCardsToUpdate.filter((u) => u.cardId === card.id);
        if (updates.length === 0) return card;

        const updatedMarked = card.marked.map((rArr) => [...rArr]);
        updates.forEach((u) => {
          updatedMarked[u.row][u.col] = nextMarked;
        });
        return { ...card, marked: updatedMarked };
      })
    );

    // Record action in Undo stack
    const undoAction: LocalUndoAction = {
      type: nextMarked ? 'MARK_CELL' : 'UNMARK_CELL',
      cardId,
      row,
      col,
      syncedCells: targetCardsToUpdate.slice(1).map((u) => ({
        cardId: u.cardId,
        row: u.row,
        col: u.col,
      })),
      number: typeof cellValue === 'number' ? cellValue : undefined,
      timestamp: Date.now(),
    };
    setUndoStack((prev) => [...prev, undoAction]);
    setRedoStack([]);

    // Persist card mark(s) to server
    for (const update of targetCardsToUpdate) {
      fetch('/api/game/cards/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: update.cardId,
          row: update.row,
          col: update.col,
          isMarked: nextMarked,
        }),
      }).catch((e) => console.error('Failed to persist mark:', e));
    }
  };

  // Undo Handler
  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    const revertedMarked = lastAction.type !== 'MARK_CELL';
    const allCells = [
      { cardId: lastAction.cardId, row: lastAction.row, col: lastAction.col },
      ...(lastAction.syncedCells || []),
    ];

    setCards((prev) =>
      prev.map((card) => {
        const matched = allCells.filter((c) => c.cardId === card.id);
        if (matched.length === 0) return card;

        const updatedMarked = card.marked.map((rArr) => [...rArr]);
        matched.forEach((c) => {
          updatedMarked[c.row][c.col] = revertedMarked;
        });
        return { ...card, marked: updatedMarked };
      })
    );

    setRedoStack((prev) => [...prev, lastAction]);

    for (const cell of allCells) {
      fetch('/api/game/cards/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: cell.cardId,
          row: cell.row,
          col: cell.col,
          isMarked: revertedMarked,
        }),
      }).catch(() => {});
    }
  };

  // Redo Handler
  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const actionToRedo = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    const redoMarked = actionToRedo.type === 'MARK_CELL';
    const allCells = [
      { cardId: actionToRedo.cardId, row: actionToRedo.row, col: actionToRedo.col },
      ...(actionToRedo.syncedCells || []),
    ];

    setCards((prev) =>
      prev.map((card) => {
        const matched = allCells.filter((c) => c.cardId === card.id);
        if (matched.length === 0) return card;

        const updatedMarked = card.marked.map((rArr) => [...rArr]);
        matched.forEach((c) => {
          updatedMarked[c.row][c.col] = redoMarked;
        });
        return { ...card, marked: updatedMarked };
      })
    );

    setUndoStack((prev) => [...prev, actionToRedo]);

    for (const cell of allCells) {
      fetch('/api/game/cards/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: cell.cardId,
          row: cell.row,
          col: cell.col,
          isMarked: redoMarked,
        }),
      }).catch(() => {});
    }
  };

  // Register Card Handler
  const handleRegisterCard = async (cardId: string) => {
    if (!game || !currentUser) return;
    setRegisteringCardId(cardId);
    setRegistrationConflictError(null);

    try {
      const res = await fetch('/api/game/cards/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          userId: currentUser.id,
          gameId: game.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, isRegistered: true } : c))
        );
      } else {
        setRegistrationConflictError(data.error || 'Failed to register card.');
      }
    } catch {
      setRegistrationConflictError('Network failure registering card.');
    } finally {
      setRegisteringCardId(null);
    }
  };

  // Register All Cards Handler
  const handleRegisterAllCards = async () => {
    if (!game || !currentUser) return;
    const unregisteredCards = cards.filter((c) => !c.isRegistered && !c.isBlocked);
    for (const card of unregisteredCards) {
      await handleRegisterCard(card.id);
    }
  };

  // REQUIREMENT 11: Claim Bingo Handler (with clientMarked synchronicity to avoid race conditions)
  const handleClaimBingo = async (cardId: string) => {
    if (!game || !currentUser) return;
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard) return;

    setClaimingCardId(cardId);

    try {
      const res = await fetch('/api/game/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          userId: currentUser.id,
          clientMarked: targetCard.marked, // Atomic marks passed to avoid marking lag race conditions
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        soundManager.playWinFanfare();
        if (data.winner) {
          setCelebrationWinner(data.winner);
        }
      } else {
        // If card was blocked, update its state immediately
        if (data.isBlocked || data.status === 'blocked') {
          setCards((prev) =>
            prev.map((c) =>
              c.id === cardId
                ? { ...c, isBlocked: true, blockReason: data.error || 'Card is blocked.' }
                : c
            )
          );
        }
        alert(data.error || 'Bingo claim could not be verified.');
      }
    } catch {
      alert('Network failure submitting claim. Please retry.');
    } finally {
      setClaimingCardId(null);
    }
  };

  // Generate Cards Handler
  const handleGenerateCards = async (count: number): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/game/cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          count,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.cards)) {
        setCards((prev) => [...prev, ...data.cards]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Clear marked numbers
  const handleClearMarkedNumbers = () => {
    setCards((prev) =>
      prev.map((card) => {
        const clearedMarked = card.marked.map((row, r) =>
          row.map((val, c) => (r === 2 && c === 2 ? true : false))
        );
        return { ...card, marked: clearedMarked };
      })
    );
  };

  if (loading) {
    return <SplashScreen />;
  }

  // REQUIREMENT 6 & 7: Admin Panel Toggle for authorized host/admin
  const isHostOrAdmin = currentUser?.role === 'host' || currentUser?.role === 'admin';

  if (showAdminPanel && isHostOrAdmin) {
    return (
      <AdminDashboard
        currentUser={currentUser}
        game={game}
        countdownSeconds={countdownSeconds}
        claimWindowSeconds={claimWindowSeconds}
        onReturnToPlayerApp={() => setShowAdminPanel(false)}
        onSwitchUser={(userId) => {
          setCurrentUser({
            id: userId,
            username: userId.includes('admin') ? 'admin_bob' : userId.includes('host') ? 'host_alice' : 'lucky_player',
            displayName: userId.includes('admin') ? 'Admin Bob' : userId.includes('host') ? 'Host Alice' : 'Lucky Player',
            email: `${userId}@bingo.app`,
            role: userId.includes('admin') ? 'admin' : userId.includes('host') ? 'host' : 'player',
            balance: 100.0,
            stats: { gamesPlayed: 20, bingosWon: 4, cardsPlayed: 50 },
          });
        }}
        onRefreshGame={fetchGameAndCards}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col antialiased text-[#1E293B]">
      {/* Sticky Header */}
      <Header
        appName={userPreferences.customAppName}
        user={currentUser}
        game={game}
        countdownSeconds={countdownSeconds}
        claimWindowSeconds={claimWindowSeconds}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenHostControls={() => setShowAdminPanel(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Player View Content
          REQUIREMENT 2: Strict visual layout order:
          1. Championship Information panel
          2. Officially called Bingo numbers
          3. Live Announcements
          4. My Bingo Cards */}
      <main className="max-w-4xl mx-auto w-full p-3.5 space-y-3.5 flex-1 pb-24">
        {/* Live Pre-Game Countdown Banner for Players */}
        {countdownSeconds > 0 && (game?.status === 'starting_countdown' || game?.status === 'pre_game_countdown') && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-4 rounded-2xl shadow-lg border border-amber-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-black tabular-nums shadow-inner border border-white/30 animate-pulse">
                {countdownSeconds}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <h2 className="font-extrabold text-base tracking-tight">The Game is Starting in {countdownSeconds}s!</h2>
                </div>
                <p className="text-amber-100 text-xs font-medium mt-0.5">
                  Get ready! Automatic number calling will begin. Keep your cards ready.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Winning Rule</span>
              <span className="text-xs font-extrabold font-mono text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 mt-1">
                {WINNING_RULE_LABELS[game?.activeWinningRule || 'horizontal_line'] || 'Horizontal Line'}
              </span>
            </div>
          </div>
        )}

        {/* 15-Second Winner Claim Window Banner for Players */}
        {claimWindowSeconds > 0 && game?.claimWindowActive && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 rounded-2xl shadow-lg border border-purple-400 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-black tabular-nums shadow-inner border border-white/30">
                {claimWindowSeconds}
              </div>
              <div>
                <h2 className="font-extrabold text-base tracking-tight">15-Second Winner Claim Window Open!</h2>
                <p className="text-purple-100 text-xs font-medium mt-0.5">
                  A player has claimed Bingo! If you have a winning pattern, click Claim Bingo before the window expires!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. Championship Information Panel (with embedded 75-board, Blocked Cards & Winners) */}
        <CollapsibleGameInfo
          game={game}
          calledNumbers={game?.calledNumbers || []}
          latestBall={game?.currentNumber || null}
          countdownSeconds={countdownSeconds}
          onNumberClick={(num) => setSelectedBallNumber(num)}
          isHost={isHostOrAdmin}
          onSelectWinnerCard={(winner) => setSelectedWinner(winner)}
          onSelectBlockedCardId={(cardId) => {
            const card = cards.find((c) => c.id === cardId);
            if (card) {
              setInspectingCard(card);
            } else {
              // Construct inspectable card representation
              setInspectingCard({
                id: cardId,
                gameId: game?.id || 'game-active',
                userId: 'player',
                matrix: [
                  [1, 16, 31, 46, 61],
                  [2, 17, 32, 47, 62],
                  [3, 18, 'FREE', 48, 63],
                  [4, 19, 34, 49, 64],
                  [5, 20, 35, 50, 65],
                ],
                marked: Array(5).fill(Array(5).fill(false)),
                isRegistered: true,
                isBlocked: true,
                createdAt: Date.now(),
                cardDateString: new Date().toISOString().split('T')[0],
              });
            }
          }}
        />

        {/* 2. Officially Called Bingo Numbers */}
        <CalledNumbersHistory
          calledNumbers={game?.calledNumbers || []}
          selectedNumber={selectedBallNumber}
          onSelectBall={(ball) => setSelectedBallNumber(ball.number)}
        />

        {/* 3. Live Announcements (Scoped to current game) */}
        <LiveAnnouncements
          announcements={game?.announcements || []}
          isServiceSuspended={game?.isServiceSuspended}
        />

        {/* 4. My Bingo Cards (with top-right 'X' delete button, zero auto-highlighting, manual marking) */}
        <BingoCardView
          cards={cards}
          calledNumbers={(game?.calledNumbers || []).map((b) => b.number)}
          gameStatus={game?.status || 'setup'}
          registrationOpen={Boolean(game?.registrationOpen)}
          claimWindowActive={Boolean(game?.claimWindowActive)}
          claimWindowSeconds={claimWindowSeconds}
          gridColumns={userPreferences.gridColumns}
          sortBy={userPreferences.sortBy}
          onToggleMark={handleToggleMark}
          onRegisterCard={handleRegisterCard}
          onRegisterAllCards={handleRegisterAllCards}
          onClaimBingo={handleClaimBingo}
          onPromptDeleteCard={(card) => setCardToDelete(card)}
          registeringCardId={registeringCardId}
          claimingCardId={claimingCardId}
          registrationConflictError={registrationConflictError}
        />
      </main>

      {/* Floating Action Button (+) to Generate Cards */}
      <div className="fixed bottom-5 right-5 z-20">
        <button
          type="button"
          onClick={() => setIsGenerateOpen(true)}
          className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 active:scale-95 text-white shadow-xl flex items-center justify-center transition cursor-pointer ring-4 ring-rose-500/20"
          title="Generate Bingo Cards"
          aria-label="Generate Bingo Cards"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* REQUIREMENT 3: Delete Card Confirmation Modal */}
      <DeleteCardModal
        card={cardToDelete}
        isOpen={Boolean(cardToDelete)}
        onClose={() => setCardToDelete(null)}
        onConfirm={handleConfirmDeleteCard}
        isDeleting={isDeletingCard}
      />

      {/* Card Generation Modal */}
      <CardGenerationModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onGenerate={handleGenerateCards}
        currentCardCount={cards.length}
        maxCards={game?.maxCardsPerPlayer || 10}
        entryPrice={game?.entryPrice || 0}
      />

      {/* Card Inspector Modal (for blocked and user cards) */}
      <CardInspectModal
        card={inspectingCard}
        calledNumbers={game?.calledNumbers || []}
        onClose={() => setInspectingCard(null)}
      />

      {/* Winner Card Modal */}
      <WinnerCardModal
        winner={selectedWinner}
        onClose={() => setSelectedWinner(null)}
      />

      {/* Claim Celebration Modal */}
      <ClaimCelebrationModal
        winner={celebrationWinner}
        onClose={() => setCelebrationWinner(null)}
      />

      {/* Ball Detail Modal */}
      <NumberDetailModal
        number={selectedBallNumber}
        ball={
          game?.calledNumbers?.find((b) => b.number === selectedBallNumber) || null
        }
        isCalled={(game?.calledNumbers || []).some((b) => b.number === selectedBallNumber)}
        onClose={() => setSelectedBallNumber(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={userPreferences}
        onUpdatePreferences={(newPrefs) =>
          setUserPreferences((prev) => ({ ...prev, ...newPrefs }))
        }
        onClearMarkedNumbers={handleClearMarkedNumbers}
        onLogout={handleLogout}
      />

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeItem={activeNavTab}
        onNavigate={(tab) => {
          setActiveNavTab(tab);
          if (tab === 'rules') setIsRulesOpen(true);
          if (tab === 'history') setIsHistoryOpen(true);
          if (tab === 'profile') setIsProfileOpen(true);
          if (tab === 'settings') setIsSettingsOpen(true);
        }}
        user={currentUser}
        onLogout={handleLogout}
        onOpenSavedCards={() => setIsSavedCardsOpen(true)}
        onOpenHostDashboard={isHostOrAdmin ? () => setShowAdminPanel(true) : undefined}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Game Rules Modal */}
      <GameRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Game History Modal */}
      <GameHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* Saved Cards Archive Modal */}
      <SavedCardsModal
        isOpen={isSavedCardsOpen}
        onClose={() => setIsSavedCardsOpen(false)}
        userId={currentUser?.id || 'usr-player-1'}
        onCardRestored={(card) => setCards((prev) => [...prev, card])}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
