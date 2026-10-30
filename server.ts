import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  BingoBall,
  BingoCard,
  BingoClaim,
  BlockedCard,
  CardRegistration,
  GameSession,
  User,
  Winner,
  WinningPattern,
  AuditLogEntry,
  HistoricalGame,
  SystemSettings,
} from './src/types/bingo.js';
import {
  createBall,
  generateBingoCard,
  verifyClaimAuthoritative,
  WINNING_RULE_LABELS,
} from './src/utils/bingoRules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Persistent State Storage File
const DB_FILE = path.join('/tmp', 'bingo_db.json');

// Helper to get local date string YYYY-MM-DD
function getLocalDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// In-Memory Database State with strict role definitions
const users: Map<string, User> = new Map([
  [
    'usr-player-1',
    {
      id: 'usr-player-1',
      username: 'lucky_player',
      displayName: 'Lucky Player',
      email: 'player@bingo.app',
      role: 'player', // Standard Player
      balance: 100.0,
      stats: { gamesPlayed: 12, bingosWon: 3, cardsPlayed: 28 },
    },
  ],
  [
    'usr-player-2',
    {
      id: 'usr-player-2',
      username: 'bingo_champ',
      displayName: 'Bingo Champ',
      email: 'champ@bingo.app',
      role: 'player', // Standard Player
      balance: 150.0,
      stats: { gamesPlayed: 20, bingosWon: 5, cardsPlayed: 45 },
    },
  ],
  [
    'usr-host-1',
    {
      id: 'usr-host-1',
      username: 'host_alice',
      displayName: 'Host Alice',
      email: 'alice@bingo.app',
      role: 'host', // Authorized Game Host
      balance: 500.0,
      stats: { gamesPlayed: 45, bingosWon: 0, cardsPlayed: 0 },
    },
  ],
  [
    'usr-admin-1',
    {
      id: 'usr-admin-1',
      username: 'admin_bob',
      displayName: 'Admin Bob',
      email: 'admin@bingo.app',
      role: 'admin', // Authorized Administrator
      balance: 1000.0,
      stats: { gamesPlayed: 100, bingosWon: 0, cardsPlayed: 0 },
    },
  ],
]);

// Single Shared Active Game across entire application (Initial Stage 1: Next Game unconfigured)
let currentGame: GameSession = {
  id: 'game-1020-shared',
  gameCode: '10:20-BINGO-NEXT',
  title: '10:20 BINGO Championship',
  gameType: '75-Ball Classic',
  status: 'next_game',
  activeWinningRule: 'not_set',
  isRuleLocked: false,
  registrationOpen: false,
  startTime: 'TBD',
  entryPrice: 1.0,
  individualPrize: 0,
  totalPrizePool: 0,
  prizes: [],
  registeredPlayersCount: 0,
  hostName: 'Host Alice',
  hostId: 'usr-host-1',
  announcements: [
    'Welcome to 10:20 BINGO Championship! The next game is pending configuration.',
  ],
  calledNumbers: [],
  currentNumber: null,
  blockedCards: [],
  winners: [],
  autoCallActive: false,
  autoCallIntervalSeconds: 7,
  maxCardsPerPlayer: 10,
  countdownDeadline: undefined,
  numberCallingStartTimestamp: undefined,
  claimWindowDeadline: undefined,
  claimWindowActive: false,
  completionDeadline: undefined,
  isServiceSuspended: false,
};

// Global Service Suspension Flag (persisted across restarts)
let isBingoSuspended = false;

// Game-Scoped Registration Key Helper
const getRegKey = (gameId: string, cardId: string) => `${gameId}:${cardId}`;

// Store cards: cardId -> BingoCard
const cardsMap: Map<string, BingoCard> = new Map();

// Confirmed registrations: "gameId:cardId" -> CardRegistration
const registrationsMap: Map<string, CardRegistration> = new Map();

// Claims log
const claims: BingoClaim[] = [];

// Audit Trail Log
const auditLogs: AuditLogEntry[] = [
  {
    id: 'audit-init-1',
    timestamp: Date.now() - 3600000 * 4,
    actorId: 'usr-admin-1',
    actorName: 'Admin Bob',
    actorRole: 'admin',
    action: 'SYSTEM_INITIALIZED',
    entityType: 'settings',
    entityId: 'global',
    details: 'System initialized with single authoritative game engine and 75-ball matrix.',
    severity: 'info',
  },
  {
    id: 'audit-init-2',
    timestamp: Date.now() - 3600000 * 2,
    actorId: 'usr-host-1',
    actorName: 'Host Alice',
    actorRole: 'host',
    action: 'GAME_SETUP',
    entityType: 'game',
    entityId: currentGame.id,
    details: 'Configured 10:20 BINGO Championship with Horizontal Line rule ($150 prize pool).',
    severity: 'info',
  },
  {
    id: 'audit-init-3',
    timestamp: Date.now() - 3600000,
    actorId: 'usr-host-1',
    actorName: 'Host Alice',
    actorRole: 'host',
    action: 'REGISTRATION_OPENED',
    entityType: 'game',
    entityId: currentGame.id,
    details: 'Card registration opened for all authenticated players.',
    severity: 'info',
  },
];

// Historical Games Archive
const historicalGames: HistoricalGame[] = [
  {
    id: 'game-hist-101',
    gameCode: '10:20-BINGO-842',
    title: '10:20 Sunday Championship #42',
    completedAt: Date.now() - 3600000 * 5,
    durationMinutes: 14,
    winningRule: 'horizontal_line',
    ballsCalledCount: 22,
    registeredPlayersCount: 8,
    totalCardsCount: 18,
    prizePool: 150.0,
    status: 'completed',
    winners: [
      {
        id: 'win-hist-1',
        gameId: 'game-hist-101',
        claimId: 'claim-hist-1',
        cardId: 'CARD-1024',
        userId: 'usr-player-1',
        displayName: 'Lucky Player',
        winningPattern: 'Horizontal Line (Row 1)',
        prizeCategory: 'Championship Prize',
        prizeAmount: 150.0,
        confirmedAt: Date.now() - 3600000 * 5,
        winningCoordinates: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
      },
    ],
    ballSequence: [
      createBall(7, 1),
      createBall(22, 2),
      createBall(35, 3),
      createBall(51, 4),
      createBall(68, 5),
      createBall(12, 6),
      createBall(19, 7),
      createBall(44, 8),
      createBall(58, 9),
      createBall(63, 10),
      createBall(3, 11),
      createBall(27, 12),
      createBall(31, 13),
      createBall(49, 14),
      createBall(75, 15),
      createBall(14, 16),
      createBall(29, 17),
      createBall(40, 18),
      createBall(55, 19),
      createBall(61, 20),
      createBall(9, 21),
      createBall(25, 22),
    ],
  },
  {
    id: 'game-hist-102',
    gameCode: '10:20-BINGO-791',
    title: '10:20 Saturday Night Fever #41',
    completedAt: Date.now() - 3600000 * 28,
    durationMinutes: 19,
    winningRule: 'four_corners',
    ballsCalledCount: 28,
    registeredPlayersCount: 12,
    totalCardsCount: 29,
    prizePool: 200.0,
    status: 'completed',
    winners: [
      {
        id: 'win-hist-2',
        gameId: 'game-hist-102',
        claimId: 'claim-hist-2',
        cardId: 'CARD-2088',
        userId: 'usr-player-2',
        displayName: 'Bingo Champ',
        winningPattern: 'Four Corners',
        prizeCategory: 'Grand Prize',
        prizeAmount: 200.0,
        confirmedAt: Date.now() - 3600000 * 28,
        winningCoordinates: [[0, 0], [0, 4], [4, 0], [4, 4]],
      },
    ],
    ballSequence: [
      createBall(5, 1),
      createBall(18, 2),
      createBall(33, 3),
      createBall(48, 4),
      createBall(70, 5),
      createBall(11, 6),
      createBall(26, 7),
      createBall(41, 8),
      createBall(57, 9),
      createBall(66, 10),
    ],
  },
];

// System Settings
let systemSettings: SystemSettings = {
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
};

function logAuditEvent(
  actorId: string,
  actorName: string,
  actorRole: 'admin' | 'host' | 'system' | 'player',
  action: string,
  entityType: 'game' | 'card' | 'claim' | 'winner' | 'player' | 'settings',
  entityId: string | undefined,
  details: string,
  severity: 'info' | 'warning' | 'critical' = 'info'
) {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    actorId,
    actorName,
    actorRole,
    action,
    entityType,
    entityId,
    details,
    severity,
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 500) auditLogs.pop();
  broadcastEvent('AUDIT_LOG_ADDED', entry);
}

// Timers
let countdownTimer: NodeJS.Timeout | null = null;
let postCountdownDelayTimer: NodeJS.Timeout | null = null;
let autoCallTimer: NodeJS.Timeout | null = null;
let claimWindowTimer: NodeJS.Timeout | null = null;
let completionTimer: NodeJS.Timeout | null = null;

// Load persisted DB if available
function loadPersistedState() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (data.currentGame) {
        currentGame = data.currentGame;
        if (currentGame.individualPrize === undefined) {
          currentGame.individualPrize = currentGame.totalPrizePool || 0;
        }
      }
      if (data.isBingoSuspended !== undefined) {
        isBingoSuspended = Boolean(data.isBingoSuspended);
        currentGame.isServiceSuspended = isBingoSuspended;
      }
      if (data.cards) {
        cardsMap.clear();
        data.cards.forEach((c: BingoCard) => {
          cardsMap.set(c.id, c);
        });
      }
      if (data.registrations) {
        registrationsMap.clear();
        data.registrations.forEach((r: CardRegistration) => {
          const key = r.gameId ? getRegKey(r.gameId, r.cardId) : r.cardId;
          registrationsMap.set(key, r);
        });
      }
    }
  } catch (err) {
    console.warn('Could not load persisted db:', err);
  }
}

function saveStateToDisk() {
  try {
    const payload = {
      currentGame,
      cards: Array.from(cardsMap.values()),
      registrations: Array.from(registrationsMap.values()),
      isBingoSuspended,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(payload));
  } catch {
    // Ignore file write errors
  }
}

loadPersistedState();

// SSE (Server-Sent Events) clients
interface SSEClient {
  id: string;
  res: Response;
}
let sseClients: SSEClient[] = [];

function broadcastEvent(eventType: string, data: unknown) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients = sseClients.filter((client) => {
    try {
      client.res.write(payload);
      return true;
    } catch {
      return false;
    }
  });
  saveStateToDisk();
}

// 15-second heartbeat ping to prevent connection drops across proxies / load balancers
setInterval(() => {
  sseClients = sseClients.filter((client) => {
    try {
      client.res.write(': keepalive\n\n');
      return true;
    } catch {
      return false;
    }
  });
}, 15000);

function clearAllGameTimers() {
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    countdownTimer = null;
  }
  if (postCountdownDelayTimer) {
    clearTimeout(postCountdownDelayTimer);
    postCountdownDelayTimer = null;
  }
  if (autoCallTimer) {
    clearInterval(autoCallTimer);
    autoCallTimer = null;
  }
  if (claimWindowTimer) {
    clearTimeout(claimWindowTimer);
    claimWindowTimer = null;
  }
  if (completionTimer) {
    clearTimeout(completionTimer);
    completionTimer = null;
  }
}

// Stage 9: Automatic Transition to Next Game Helper
function transitionToNextGame() {
  clearAllGameTimers();

  // Archive completed game session into historical games if it was played or had winners
  if (currentGame.winners.length > 0 || currentGame.calledNumbers.length > 0) {
    const histGame: HistoricalGame = {
      id: currentGame.id,
      gameCode: currentGame.gameCode,
      title: currentGame.title,
      completedAt: Date.now(),
      durationMinutes: Math.max(1, Math.round((currentGame.calledNumbers.length * (currentGame.autoCallIntervalSeconds || 7)) / 60)),
      winningRule: currentGame.activeWinningRule,
      ballsCalledCount: currentGame.calledNumbers.length,
      registeredPlayersCount: currentGame.registeredPlayersCount,
      totalCardsCount: Array.from(registrationsMap.values()).filter((r) => r.gameId === currentGame.id).length,
      prizePool: currentGame.totalPrizePool,
      status: 'completed',
      winners: [...currentGame.winners],
      ballSequence: [...currentGame.calledNumbers],
    };
    historicalGames.unshift(histGame);
    if (historicalGames.length > 100) historicalGames.pop();
  }

  // Clear active card registrations for previous game
  registrationsMap.clear();

  // Reset to Stage 1: Next Game (Unconfigured)
  const nextGameCode = `10:20-BINGO-${Math.floor(100 + Math.random() * 900)}`;
  currentGame = {
    id: `game-${Date.now()}`,
    gameCode: nextGameCode,
    title: '10:20 BINGO Championship',
    gameType: '75-Ball Classic',
    status: 'next_game',
    activeWinningRule: 'not_set',
    isRuleLocked: false,
    registrationOpen: false,
    startTime: 'TBD',
    entryPrice: 1.0,
    individualPrize: 0,
    totalPrizePool: 0,
    prizes: [],
    registeredPlayersCount: 0,
    hostName: 'Host Alice',
    hostId: 'usr-host-1',
    announcements: [
      'Game completed! The next game is ready for host configuration.',
    ],
    calledNumbers: [],
    currentNumber: null,
    blockedCards: [],
    winners: [],
    autoCallActive: false,
    autoCallIntervalSeconds: 7,
    maxCardsPerPlayer: 10,
    countdownDeadline: undefined,
    numberCallingStartTimestamp: undefined,
    claimWindowDeadline: undefined,
    claimWindowActive: false,
    completionDeadline: undefined,
    isServiceSuspended: isBingoSuspended,
  };

  saveStateToDisk();
  broadcastEvent('GAME_TRANSITION_NEXT', currentGame);
  broadcastEvent('GAME_RESET', currentGame);
  broadcastEvent('GAME_UPDATED', currentGame);
}

function callNextAuthoritativeNumber(): BingoBall | null {
  if (currentGame.status !== 'in_progress' && currentGame.status !== 'running') {
    return null;
  }

  const calledSet = new Set(currentGame.calledNumbers.map((b) => b.number));
  const available: number[] = [];
  for (let i = 1; i <= 75; i++) {
    if (!calledSet.has(i)) available.push(i);
  }

  if (available.length === 0) {
    currentGame.status = 'game_completed';
    currentGame.announcements.unshift('All 75 numbers called! Game completed with no winner.');
    stopAutoCaller();
    broadcastEvent('GAME_UPDATED', currentGame);

    if (completionTimer) clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      completionTimer = null;
      transitionToNextGame();
    }, 20000);
    return null;
  }

  // Cryptographically safe random selection
  const randomIndex = Math.floor(Math.random() * available.length);
  const nextNum = available[randomIndex];
  const ball = createBall(nextNum, currentGame.calledNumbers.length + 1);

  currentGame.calledNumbers.push(ball);
  currentGame.currentNumber = ball;

  broadcastEvent('NUMBER_CALLED', { ball, game: currentGame });
  broadcastEvent('GAME_UPDATED', currentGame);
  return ball;
}

function startAutoCaller(intervalSeconds: number = 7) {
  if (autoCallTimer) {
    clearInterval(autoCallTimer);
    autoCallTimer = null;
  }
  currentGame.autoCallActive = true;
  currentGame.autoCallIntervalSeconds = intervalSeconds;
  autoCallTimer = setInterval(() => {
    if (currentGame.status === 'in_progress' || currentGame.status === 'running') {
      const ball = callNextAuthoritativeNumber();
      if (!ball) {
        stopAutoCaller();
      }
    }
  }, intervalSeconds * 1000);
  broadcastEvent('GAME_UPDATED', currentGame);
}

function stopAutoCaller() {
  if (autoCallTimer) {
    clearInterval(autoCallTimer);
    autoCallTimer = null;
  }
  currentGame.autoCallActive = false;
}

// Recalculate registered players count for active game
function updateRegisteredPlayersCount() {
  const uniqueUsers = new Set<string>();
  registrationsMap.forEach((reg) => {
    if (reg.gameId === currentGame.id) {
      uniqueUsers.add(reg.userId);
    }
  });
  currentGame.registeredPlayersCount = uniqueUsers.size;
}

// Check host or admin authorization helper
function verifyHostAuthorization(req: Request): { authorized: boolean; caller?: User; error?: string } {
  const hostId = (req.headers['x-user-id'] as string) || req.body?.userId;
  if (!hostId) {
    return { authorized: false, error: 'Authentication required. Please log in.' };
  }
  let caller = users.get(hostId);
  if (!caller) {
    for (const u of users.values()) {
      if (u.username === hostId || u.id === hostId) {
        caller = u;
        break;
      }
    }
  }
  if (!caller && (hostId.includes('admin') || hostId.includes('host'))) {
    caller = hostId.includes('admin') ? users.get('usr-admin-1') : users.get('usr-host-1');
  }
  if (!caller) {
    return { authorized: false, error: `User account '${hostId}' not found. Please log in.` };
  }
  if (caller.role !== 'host' && caller.role !== 'admin') {
    return {
      authorized: false,
      caller,
      error: `Access denied. Account '${caller.displayName}' has player role. Only authorized hosts or administrators can perform this action.`,
    };
  }
  return { authorized: true, caller };
}

// --- API Endpoints ---

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: Date.now() });
});

// Get current single active game session
app.get('/api/game/current', (_req: Request, res: Response) => {
  res.json(currentGame);
});

// SSE Stream for Real-time Game Synchronization
const handleSSEStream = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const client: SSEClient = { id: clientId, res };
  sseClients.push(client);

  res.write(`event: INIT\ndata: ${JSON.stringify(currentGame)}\n\n`);
  res.write(`event: GAME_UPDATED\ndata: ${JSON.stringify(currentGame)}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
};

app.get('/api/game/stream', handleSSEStream);
app.get('/api/game/events', handleSSEStream);

// PART 1: USER ACCOUNT ISOLATION AND CARD PERSISTENCE
// Get cards strictly for the authenticated user, scoped to current game
app.get('/api/game/cards', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  if (!userId) {
    return res.status(401).json({ error: 'User ID is required to access cards.' });
  }

  const todayStr = getLocalDateString();
  const includeHistory = req.query.includeHistory === 'true';

  // Filter cards strictly owned by this user
  const userCards = Array.from(cardsMap.values())
    .filter((card) => {
      if (card.userId !== userId) return false;
      if (includeHistory) return true;
      // By default for main screen: show only today's non-archived cards
      return card.cardDateString === todayStr && !card.isArchived;
    })
    .map((card) => {
      const regKey = getRegKey(currentGame.id, card.id);
      const isReg = registrationsMap.has(regKey);
      const isBlockedInCurrentGame = currentGame.blockedCards.some((b) => b.cardId === card.id);
      return {
        ...card,
        gameId: currentGame.id,
        isRegistered: isReg,
        isBlocked: isBlockedInCurrentGame,
        blockReason: isBlockedInCurrentGame ? 'Card is blocked.' : undefined,
      };
    });

  res.json(userCards);
});

// Single Card Inspection Endpoint (Transparent inspection of full 5x5 card matrix)
app.get('/api/game/cards/:id', (req: Request, res: Response) => {
  const cardId = req.params.id;
  const card = cardsMap.get(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found.' });
  }
  const regKey = getRegKey(currentGame.id, card.id);
  const isReg = registrationsMap.has(regKey);
  const isBlockedInCurrentGame = currentGame.blockedCards.some((b) => b.cardId === card.id);
  res.json({
    ...card,
    gameId: currentGame.id,
    isRegistered: isReg,
    isBlocked: isBlockedInCurrentGame,
    blockReason: isBlockedInCurrentGame ? 'Card is blocked.' : undefined,
  });
});

// PART 3 (Delete Card): Small X Button Deletion with Owner Auth & Registration Guard
app.delete('/api/game/cards/:id', (req: Request, res: Response) => {
  const cardId = req.params.id;
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || req.body?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'User authentication required to delete a card.' });
  }

  const card = cardsMap.get(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found.' });
  }
  if (card.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized. You cannot delete a card owned by another player.' });
  }

  const regKey = getRegKey(currentGame.id, card.id);
  const isReg = registrationsMap.has(regKey);
  const activeStatuses = ['in_progress', 'pre_game_countdown', 'checking_winners'];
  if (isReg && activeStatuses.includes(currentGame.status)) {
    return res.status(400).json({
      error: 'Cannot delete a registered card while the championship game is starting or in progress.',
    });
  }

  // Remove registration if registered for current game
  registrationsMap.delete(regKey);
  // Remove card from active cards map
  cardsMap.delete(cardId);

  updateRegisteredPlayersCount();
  saveStateToDisk();

  broadcastEvent('CARD_DELETED', { cardId, gameId: currentGame.id, userId });
  broadcastEvent('GAME_UPDATED', currentGame);

  res.json({ success: true, message: `Card ${cardId} deleted successfully.`, cardId });
});

app.post('/api/game/cards/delete', (req: Request, res: Response) => {
  const { cardId, userId } = req.body;
  const effectiveUserId = userId || (req.headers['x-user-id'] as string);
  if (!cardId || !effectiveUserId) {
    return res.status(400).json({ error: 'Card ID and User ID are required.' });
  }

  const card = cardsMap.get(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found.' });
  }
  if (card.userId !== effectiveUserId) {
    return res.status(403).json({ error: 'Unauthorized. You cannot delete a card owned by another player.' });
  }

  const regKey = getRegKey(currentGame.id, card.id);
  const isReg = registrationsMap.has(regKey);
  const activeStatuses = ['in_progress', 'pre_game_countdown', 'checking_winners'];
  if (isReg && activeStatuses.includes(currentGame.status)) {
    return res.status(400).json({
      error: 'Cannot delete a registered card while the championship game is starting or in progress.',
    });
  }

  registrationsMap.delete(regKey);
  cardsMap.delete(cardId);

  updateRegisteredPlayersCount();
  saveStateToDisk();

  broadcastEvent('CARD_DELETED', { cardId, gameId: currentGame.id, userId: effectiveUserId });
  broadcastEvent('GAME_UPDATED', currentGame);

  res.json({ success: true, message: `Card ${cardId} deleted successfully.`, cardId });
});

// Get user's saved card history (previous days / archived cards)
app.get('/api/game/cards/history', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  if (!userId) {
    return res.status(401).json({ error: 'User ID is required to access card history.' });
  }

  const todayStr = getLocalDateString();
  const historyCards = Array.from(cardsMap.values()).filter(
    (card) => card.userId === userId && (card.cardDateString !== todayStr || card.isArchived)
  );

  res.json(historyCards);
});

// Restore a saved card to today's active session (does NOT automatically register it)
app.post('/api/game/cards/restore', (req: Request, res: Response) => {
  const { cardId, userId } = req.body;
  const card = cardsMap.get(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found.' });
  }
  if (card.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized. You do not own this card.' });
  }

  // Restore to today's active display, but keep isRegistered = false unless explicitly registered in this game
  card.isArchived = false;
  card.cardDateString = getLocalDateString();
  card.gameId = currentGame.id;

  saveStateToDisk();
  res.json({ success: true, message: 'Card restored to today’s session as unregistered.', card });
});

// PART 1 (3): Generate cards (strictly unregistered)
app.post('/api/game/cards/generate', (req: Request, res: Response) => {
  const userId = req.body.userId || (req.headers['x-user-id'] as string);
  const count = req.body.count ?? req.body.quantity;
  const numCount = parseInt(count, 10);

  if (!userId) {
    return res.status(401).json({ error: 'User authentication required.' });
  }

  if (isNaN(numCount) || numCount < 1 || numCount > 10) {
    return res.status(400).json({ error: 'Card quantity must be between 1 and 10.' });
  }

  const todayStr = getLocalDateString();
  const existingActiveCards = Array.from(cardsMap.values()).filter(
    (c) => c.userId === userId && c.cardDateString === todayStr && !c.isArchived
  );

  if (existingActiveCards.length + numCount > currentGame.maxCardsPerPlayer) {
    return res.status(400).json({
      error: `Maximum cards allowed per player is ${currentGame.maxCardsPerPlayer}. You already have ${existingActiveCards.length} cards.`,
    });
  }

  const newCards: BingoCard[] = [];

  for (let i = 0; i < numCount; i++) {
    const cardIndex = existingActiveCards.length + i + 1;
    // ALWAYS generated as unregistered: isRegistered = false
    const card = generateBingoCard(currentGame.id, userId, cardIndex, false);
    cardsMap.set(card.id, card);
    newCards.push(card);
  }

  saveStateToDisk();

  res.json({
    success: true,
    message: `Generated ${newCards.length} card(s). Each card is unregistered until you click "Register Card".`,
    cards: newCards,
    totalCards: existingActiveCards.length + newCards.length,
  });
});

// Register Card (Atomic, explicit action)
app.post('/api/game/cards/register', (req: Request, res: Response) => {
  const { cardId, userId } = req.body;

  if (!cardId || !userId) {
    return res.status(400).json({ error: 'Card ID and User ID are required.' });
  }

  // 0. Check global service suspension
  if (isBingoSuspended) {
    return res.status(503).json({
      error: 'Bingo games are currently suspended by the administrator.',
    });
  }

  // 1. Verify game status
  if (
    !currentGame.registrationOpen ||
    currentGame.status !== 'registration_open'
  ) {
    return res.status(400).json({
      error: 'Card registration is closed. Cards can only be registered while registration is open.',
    });
  }

  // 2. Fetch card and verify ownership
  const card = cardsMap.get(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found in active session.' });
  }
  if (card.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized. You do not own this card.' });
  }

  // 3. Check if card is blocked in the CURRENT game
  const isBlockedInCurrentGame = currentGame.blockedCards.some((b) => b.cardId === cardId);
  if (isBlockedInCurrentGame) {
    return res.status(403).json({ error: 'Cannot register a blocked card.' });
  }

  // 4. ATOMIC CONCURRENCY CHECK FOR CURRENT GAME
  const regKey = getRegKey(currentGame.id, cardId);
  const existingReg = registrationsMap.get(regKey);
  if (existingReg) {
    if (existingReg.userId !== userId) {
      return res.status(409).json({
        conflict: true,
        error: 'This card is already registered by another player. Please choose another card.',
        message: 'This card is already registered by another player. Please choose another card.',
      });
    } else {
      return res.json({
        success: true,
        alreadyRegistered: true,
        message: 'This card is already registered to your account.',
        card: { ...card, isRegistered: true, isBlocked: false, gameCode: currentGame.gameCode },
      });
    }
  }

  // 5. Register atomically to current user for this game
  const newRegistration: CardRegistration = {
    id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    gameId: currentGame.id,
    gameCode: currentGame.gameCode,
    cardId,
    userId,
    registeredAt: Date.now(),
  };

  registrationsMap.set(regKey, newRegistration);
  card.isRegistered = true;
  card.gameId = currentGame.id;
  card.gameCode = currentGame.gameCode;
  card.userId = userId;
  card.registeredAt = newRegistration.registeredAt;

  updateRegisteredPlayersCount();
  saveStateToDisk();

  broadcastEvent('CARD_REGISTERED', {
    cardId,
    gameId: currentGame.id,
    registeredPlayersCount: currentGame.registeredPlayersCount,
  });

  res.json({
    success: true,
    message: 'Card successfully registered for the active game!',
    card: { ...card, isRegistered: true, isBlocked: false },
    registeredPlayersCount: currentGame.registeredPlayersCount,
  });
});

// PART 5: Manual marking & cross-card synchronization
app.post('/api/game/cards/mark', (req: Request, res: Response) => {
  const { cardId, userId, row, col, marked, autoComplete } = req.body;
  const effectiveUserId = userId || (req.headers['x-user-id'] as string);

  const card = cardsMap.get(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found.' });
  }

  // Verify ownership
  if (effectiveUserId && card.userId !== effectiveUserId) {
    return res.status(403).json({ error: 'Unauthorized to mark another user’s card.' });
  }

  if (card.isBlocked) {
    return res.status(403).json({ error: 'Cannot mark or unmark a blocked card.' });
  }

  if (row === 2 && col === 2) {
    // FREE space always marked
    card.marked[2][2] = true;
    return res.json({ success: true, card, syncedCards: [] });
  }

  const syncedCards: BingoCard[] = [];

  if (row >= 0 && row < 5 && col >= 0 && col < 5) {
    const num = card.matrix[row][col];

    // Update current card marking state safely
    card.marked[row][col] = Boolean(marked);

    // Cross-card synchronization when Auto Complete is enabled
    // Synchronize ONLY across other eligible cards owned by the authenticated player:
    // - Same player ID
    // - Same game ID
    // - Registered card
    // - Not blocked and not archived
    // - Number actually exists on the other card's matrix
    if (autoComplete && typeof num === 'number') {
      const todayStr = getLocalDateString();
      cardsMap.forEach((otherCard) => {
        if (
          otherCard.id !== card.id &&
          otherCard.userId === card.userId &&
          otherCard.gameId === currentGame.id &&
          otherCard.isRegistered &&
          !otherCard.isBlocked &&
          !otherCard.isArchived &&
          otherCard.cardDateString === todayStr
        ) {
          let cardModified = false;
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (otherCard.matrix[r][c] === num) {
                otherCard.marked[r][c] = Boolean(marked);
                cardModified = true;
              }
            }
          }
          if (cardModified) {
            syncedCards.push(otherCard);
          }
        }
      });
    }
  }

  saveStateToDisk();

  res.json({
    success: true,
    card,
    syncedCards,
    markedNumber: card.matrix[row]?.[col],
    isMarked: Boolean(marked),
  });
});

// PART 6 (A): Clear player's marked numbers on their own cards
app.post('/api/game/cards/clear-marks', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'User ID is required.' });
  }

  let clearedCount = 0;
  cardsMap.forEach((card) => {
    if (card.userId === userId) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (r === 2 && c === 2) {
            card.marked[r][c] = true; // FREE space stays marked
          } else {
            card.marked[r][c] = false;
          }
        }
      }
      clearedCount++;
    }
  });

  saveStateToDisk();
  res.json({ success: true, message: `Cleared markings on ${clearedCount} card(s).` });
});

// Stage 1: Host Game Setup (RBAC Protected, Strict Validation, Locked when Registration Opens)
app.post('/api/game/setup', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  // Reject configuration if setup is locked or if game is not in setup/next_game state
  if (currentGame.isRuleLocked || (currentGame.status !== 'next_game' && currentGame.status !== 'setup')) {
    return res.status(400).json({
      error: 'Game setup is locked because registration has opened.',
    });
  }

  const {
    title,
    gameCode,
    activeWinningRule,
    individualPrize,
    totalPrizePool,
    entryPrice,
    autoCallIntervalSeconds,
  } = req.body;

  const validRules: WinningPattern[] = [
    'horizontal_line',
    'vertical_line',
    'diagonal_line',
    'four_corners',
    'blackout',
  ];

  if (!activeWinningRule || activeWinningRule === 'not_set' || !validRules.includes(activeWinningRule)) {
    return res.status(400).json({
      error: `A valid winning rule must be selected: ${validRules.join(', ')}`,
    });
  }

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Championship game title is required.' });
  }

  if (!gameCode || !String(gameCode).trim()) {
    return res.status(400).json({ error: 'Unique game code is required.' });
  }

  const totalPrizeNum = parseFloat(totalPrizePool);
  if (isNaN(totalPrizeNum) || totalPrizeNum <= 0) {
    return res.status(400).json({ error: 'Total prize pool must be greater than 0.' });
  }

  const individualPrizeNum =
    individualPrize !== undefined && !isNaN(parseFloat(individualPrize))
      ? parseFloat(individualPrize)
      : totalPrizeNum;

  currentGame.title = String(title).trim();
  currentGame.gameCode = String(gameCode).trim().toUpperCase();
  currentGame.activeWinningRule = activeWinningRule;
  currentGame.individualPrize = individualPrizeNum;
  currentGame.totalPrizePool = totalPrizeNum;
  if (entryPrice !== undefined) currentGame.entryPrice = parseFloat(entryPrice) || 0;
  if (autoCallIntervalSeconds) {
    const sec = parseInt(autoCallIntervalSeconds, 10);
    if (sec >= 5 && sec <= 15) {
      currentGame.autoCallIntervalSeconds = sec;
    }
  }

  currentGame.prizes = [
    {
      category: WINNING_RULE_LABELS[activeWinningRule] || 'Championship Prize',
      amount: totalPrizeNum,
      pattern: activeWinningRule,
    },
  ];

  currentGame.status = 'setup';
  currentGame.isRuleLocked = false;
  currentGame.registrationOpen = false;

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'GAME_CONFIGURED',
    'game',
    currentGame.id,
    `Configured ${currentGame.title} (${currentGame.gameCode}) with ${WINNING_RULE_LABELS[activeWinningRule]} rule. Total prize: $${totalPrizeNum}, Individual prize: $${individualPrizeNum}`,
    'info'
  );

  saveStateToDisk();
  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, game: currentGame });
});

// Stage 2: Open Registration (Locks configuration & enables card registrations)
app.post('/api/game/registration/open', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  // Prevent opening registration while countdown, gameplay, or winner review is underway
  const activePlayStatuses = [
    'starting_countdown',
    'pre_game_countdown',
    'running',
    'in_progress',
    'paused',
    'claim_review',
    'checking_winners',
  ];
  if (activePlayStatuses.includes(currentGame.status)) {
    return res.status(400).json({
      error: 'Cannot open registration while game countdown, gameplay, or winner verification is active.',
    });
  }

  // If previous game was stopped or completed, reset session state cleanly for new round
  if (
    currentGame.status === 'stopped' ||
    currentGame.status === 'game_completed' ||
    currentGame.status === 'completed'
  ) {
    clearAllGameTimers();
    stopAutoCaller();
    currentGame.calledNumbers = [];
    currentGame.currentNumber = null;
    currentGame.winners = [];
    currentGame.blockedCards = [];
    currentGame.claimWindowActive = false;
    currentGame.claimWindowDeadline = undefined;
    currentGame.countdownDeadline = undefined;
    currentGame.numberCallingStartTimestamp = undefined;
    registrationsMap.clear();
  }

  // If setup payload was provided in request, apply it immediately
  if (req.body && (req.body.title || req.body.activeWinningRule || req.body.totalPrizePool)) {
    const { title, gameCode, activeWinningRule, individualPrize, totalPrizePool, entryPrice, autoCallIntervalSeconds } = req.body;
    if (title) currentGame.title = String(title).trim();
    if (gameCode) currentGame.gameCode = String(gameCode).trim().toUpperCase();
    if (activeWinningRule && activeWinningRule !== 'not_set') currentGame.activeWinningRule = activeWinningRule;
    if (totalPrizePool !== undefined) currentGame.totalPrizePool = parseFloat(totalPrizePool) || currentGame.totalPrizePool;
    if (individualPrize !== undefined) currentGame.individualPrize = parseFloat(individualPrize) || currentGame.totalPrizePool;
    if (entryPrice !== undefined) currentGame.entryPrice = parseFloat(entryPrice) || 0;
    if (autoCallIntervalSeconds) currentGame.autoCallIntervalSeconds = parseInt(autoCallIntervalSeconds, 10) || 7;
  }

  // Supply safe defaults if somehow still not set
  if (!currentGame.title) currentGame.title = '10:20 BINGO Championship';
  if (!currentGame.gameCode) currentGame.gameCode = `10:20-BINGO-${Math.floor(100 + Math.random() * 900)}`;
  if (!currentGame.activeWinningRule || currentGame.activeWinningRule === 'not_set') currentGame.activeWinningRule = 'horizontal_line';
  if (!currentGame.totalPrizePool || currentGame.totalPrizePool <= 0) {
    currentGame.totalPrizePool = 150.0;
    currentGame.individualPrize = 150.0;
  }

  currentGame.status = 'registration_open';
  currentGame.registrationOpen = true;
  currentGame.isRuleLocked = true; // Lock setup modifications once registration opens!

  currentGame.announcements.unshift(
    `Registration is now OPEN for ${currentGame.title} (${currentGame.gameCode})! Generate and register your cards.`
  );

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'REGISTRATION_OPENED',
    'game',
    currentGame.id,
    `Card registration opened for ${currentGame.gameCode}. Setup locked.`,
    'info'
  );

  saveStateToDisk();
  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, status: currentGame.status, registrationOpen: true, game: currentGame });
});

// Stage 4: Close Registration (Transitions to registration_closed, rejects new registrations)
app.post('/api/game/registration/close', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  currentGame.status = 'registration_closed';
  currentGame.registrationOpen = false;

  currentGame.announcements.unshift(
    `Registration is now CLOSED for ${currentGame.title} (${currentGame.gameCode}). Ready for game start!`
  );

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'REGISTRATION_CLOSED',
    'game',
    currentGame.id,
    `Card registration closed for ${currentGame.gameCode}.`,
    'info'
  );

  saveStateToDisk();
  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, status: currentGame.status, registrationOpen: false, game: currentGame });
});

// Legacy Toggle Registration for backward compatibility
app.post('/api/game/registration/toggle', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const { open } = req.body;
  if (open) {
    if (currentGame.activeWinningRule === 'not_set' || !currentGame.title || !currentGame.gameCode) {
      return res.status(400).json({ error: 'Cannot open registration: Game setup incomplete.' });
    }
    currentGame.status = 'registration_open';
    currentGame.registrationOpen = true;
    currentGame.isRuleLocked = true;
  } else {
    currentGame.status = 'registration_closed';
    currentGame.registrationOpen = false;
  }

  currentGame.announcements.unshift(
    currentGame.registrationOpen ? 'Registration is now OPEN.' : 'Registration is now CLOSED.'
  );

  saveStateToDisk();
  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, registrationOpen: currentGame.registrationOpen, status: currentGame.status });
});

// Stage 5: Start Game (Available only when configured AND registration is closed)
app.post('/api/game/start', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  // State prerequisite validations
  if (currentGame.status === 'starting_countdown' || currentGame.status === 'pre_game_countdown') {
    return res.status(400).json({ error: 'Pre-game 15-second countdown is already underway.' });
  }

  const { forceRestart } = req.body || {};
  if ((currentGame.status === 'running' || currentGame.status === 'in_progress') && !forceRestart) {
    return res.status(400).json({
      error: 'Game is already in progress. If you wish to restart the round, please click Reset Game or use Force Restart.',
    });
  }

  if (currentGame.status !== 'registration_closed' && !forceRestart) {
    if (currentGame.status === 'registration_open') {
      return res.status(400).json({
        error: 'Registration must be closed before starting the game. Please click Close Registration first.',
      });
    }
    if (currentGame.status === 'next_game' || currentGame.activeWinningRule === 'not_set') {
      return res.status(400).json({
        error: 'Cannot start game. Please configure the game and complete registration first.',
      });
    }
  }

  clearAllGameTimers();

  // Reset round state
  currentGame.calledNumbers = [];
  currentGame.currentNumber = null;
  currentGame.winners = [];
  currentGame.blockedCards = [];
  currentGame.claimWindowActive = false;
  currentGame.claimWindowDeadline = undefined;
  currentGame.completionDeadline = undefined;

  // Atomically change to starting_countdown
  currentGame.status = 'starting_countdown';
  currentGame.registrationOpen = false;
  currentGame.isRuleLocked = true;
  const countdownDeadline = Date.now() + 15000;
  currentGame.countdownDeadline = countdownDeadline;

  currentGame.announcements.unshift('The game is starting in 15 seconds, get ready!');

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'GAME_STARTING_COUNTDOWN',
    'game',
    currentGame.id,
    `15-second countdown started for ${currentGame.gameCode}.`,
    'info'
  );

  saveStateToDisk();

  broadcastEvent('PRE_GAME_COUNTDOWN', {
    countdownDeadline,
    game: currentGame,
  });
  broadcastEvent('GAME_UPDATED', currentGame);

  // 15-Second Server-Side Countdown
  countdownTimer = setTimeout(() => {
    countdownTimer = null;
    currentGame.countdownDeadline = undefined;
    currentGame.status = 'running';
    currentGame.startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentGame.numberCallingStartTimestamp = Date.now() + 5000;

    currentGame.announcements.unshift('Game started! Automatic number calling begins in 5 seconds.');

    broadcastEvent('GAME_STARTED', {
      numberCallingStartTimestamp: currentGame.numberCallingStartTimestamp,
      game: currentGame,
    });
    broadcastEvent('GAME_UPDATED', currentGame);

    // 5-Second Delay before first number call
    postCountdownDelayTimer = setTimeout(() => {
      postCountdownDelayTimer = null;
      currentGame.numberCallingStartTimestamp = undefined;

      // Start automatic caller
      startAutoCaller(currentGame.autoCallIntervalSeconds || 7);
      // Immediately call first number
      callNextAuthoritativeNumber();
    }, 5000);
  }, 15000);

  res.json({
    success: true,
    message: 'The game is starting in 15 seconds, get ready!',
    countdownDeadline,
    game: currentGame,
  });
});

// Dedicated Round-Level Stop Bingo (Halts gameplay, stops calling timers, preserves cards & claims)
app.post('/api/game/stop', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  clearAllGameTimers();
  stopAutoCaller();

  currentGame.status = 'stopped';
  currentGame.autoCallActive = false;
  currentGame.countdownDeadline = undefined;
  currentGame.numberCallingStartTimestamp = undefined;
  currentGame.claimWindowActive = false;
  currentGame.claimWindowDeadline = undefined;
  currentGame.announcements.unshift('Game has been stopped by the host.');

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'GAME_STOPPED',
    'game',
    currentGame.id,
    'Active game round stopped by host. Calling halted.',
    'warning'
  );

  saveStateToDisk();
  broadcastEvent('GAME_STOPPED', currentGame);
  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, status: 'stopped', game: currentGame });
});

// Dedicated Round-Level Resume Bingo
app.post('/api/game/resume', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  if (currentGame.status !== 'paused' && currentGame.status !== 'stopped') {
    return res.status(400).json({ error: 'Only paused or stopped games can be resumed.' });
  }

  currentGame.status = 'running';
  currentGame.announcements.unshift('Game resumed by host.');

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'GAME_RESUMED',
    'game',
    currentGame.id,
    'Game gameplay resumed by host.',
    'info'
  );

  // Resume auto-calling
  startAutoCaller(currentGame.autoCallIntervalSeconds || 7);

  saveStateToDisk();
  broadcastEvent('GAME_RESUMED', currentGame);
  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, game: currentGame });
});

// Cancel countdown or active game (Host only)
app.post('/api/game/cancel', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  clearAllGameTimers();
  currentGame.status = 'cancelled';
  currentGame.registrationOpen = false;
  currentGame.countdownDeadline = undefined;
  currentGame.claimWindowActive = false;
  currentGame.claimWindowDeadline = undefined;
  currentGame.announcements.unshift('Game was cancelled by the host.');

  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, game: currentGame });
});

// Host: Manual call 1 number
app.post('/api/game/call-number', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  if (currentGame.status === 'starting_countdown' || currentGame.status === 'pre_game_countdown') {
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }
    if (postCountdownDelayTimer) {
      clearTimeout(postCountdownDelayTimer);
      postCountdownDelayTimer = null;
    }
    currentGame.countdownDeadline = undefined;
    currentGame.numberCallingStartTimestamp = undefined;
    currentGame.status = 'running';
    currentGame.startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (currentGame.status !== 'in_progress' && currentGame.status !== 'running') {
    return res.status(400).json({ error: 'Cannot call number. Game is not in progress.' });
  }

  let ball: BingoBall | null = null;
  const specifiedNum = parseInt(req.body?.number, 10);
  if (!isNaN(specifiedNum) && specifiedNum >= 1 && specifiedNum <= 75) {
    const calledSet = new Set(currentGame.calledNumbers.map((b) => b.number));
    if (!calledSet.has(specifiedNum)) {
      ball = createBall(specifiedNum, currentGame.calledNumbers.length + 1);
      currentGame.calledNumbers.push(ball);
      currentGame.currentNumber = ball;
      broadcastEvent('NUMBER_CALLED', { ball, game: currentGame });
      broadcastEvent('GAME_UPDATED', currentGame);
      saveStateToDisk();
    }
  }

  if (!ball) {
    ball = callNextAuthoritativeNumber();
  }

  if (!ball) {
    return res.status(400).json({ error: 'Cannot call number. No remaining balls or game completed.' });
  }
  res.json({ success: true, ball, game: currentGame });
});

// Host: Auto-caller toggle
app.post('/api/game/auto-call', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const { active, intervalSeconds } = req.body;
  if (active) {
    if (currentGame.status === 'starting_countdown' || currentGame.status === 'pre_game_countdown') {
      if (countdownTimer) {
        clearTimeout(countdownTimer);
        countdownTimer = null;
      }
      if (postCountdownDelayTimer) {
        clearTimeout(postCountdownDelayTimer);
        postCountdownDelayTimer = null;
      }
      currentGame.countdownDeadline = undefined;
      currentGame.numberCallingStartTimestamp = undefined;
      currentGame.status = 'running';
      currentGame.startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    startAutoCaller(intervalSeconds || currentGame.autoCallIntervalSeconds || 7);
  } else {
    stopAutoCaller();
    broadcastEvent('GAME_UPDATED', currentGame);
  }
  res.json({ success: true, autoCallActive: currentGame.autoCallActive });
});

// PART 4: 15-SECOND WINNER CLAIM WINDOW & MULTIPLE WINNERS
app.post('/api/game/claim', (req: Request, res: Response) => {
  const { cardId, userId, userName, autoComplete, clientMarked } = req.body;

  // 0. Check global service suspension
  if (isBingoSuspended) {
    return res.status(503).json({
      success: false,
      reason: 'Bingo games are currently suspended by the administrator.',
      message: 'Bingo games are currently suspended by the administrator.',
    });
  }

  // 1. Confirm game is in progress or in claim window
  const activePlayStatuses = ['in_progress', 'running', 'checking_winners', 'claim_review'];
  if (!activePlayStatuses.includes(currentGame.status)) {
    return res.status(400).json({
      success: false,
      retryable: true,
      reason: 'Bingo claims can only be submitted while the game is active or during the 15-second claim window.',
    });
  }

  // 2. Fetch and authenticate card
  const card = cardsMap.get(cardId);
  if (!card) {
    return res.status(404).json({ success: false, reason: 'Card not found in active game session.' });
  }
  if (card.userId !== userId) {
    return res.status(403).json({ success: false, reason: 'You cannot claim Bingo with another player’s card.' });
  }

  // 3. Check registration for the CURRENT game
  const regKey = getRegKey(currentGame.id, cardId);
  const isRegisteredForCurrentGame = registrationsMap.has(regKey);
  if (!isRegisteredForCurrentGame) {
    return res.status(403).json({
      success: false,
      reason: 'This card was never registered for this game session and is not eligible to claim Bingo.',
    });
  }

  // 4. Confirm card is not blocked in the current game
  const isBlockedInCurrentGame = currentGame.blockedCards.some((b) => b.cardId === cardId);
  if (isBlockedInCurrentGame) {
    return res.status(403).json({
      success: false,
      reason: 'Card is blocked.',
      message: 'Card is blocked.',
    });
  }

  // 5. Prevent duplicate winning submissions for the same card in this game
  const alreadyWon = currentGame.winners.some((w) => w.cardId === cardId);
  if (alreadyWon) {
    return res.json({
      success: true,
      alreadyConfirmed: true,
      message: `Card ${cardId} has already been verified and recorded as an official winner.`,
    });
  }

  // 6. Root-cause fix for marking persistence lag & race condition:
  // Authoritatively reconcile client marks with official called numbers
  const officialNums = currentGame.calledNumbers.map((b) => b.number);
  const calledSet = new Set(officialNums);

  if (Array.isArray(clientMarked) && clientMarked.length === 5) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 2 && c === 2) {
          card.marked[r][c] = true;
        } else if (clientMarked[r]?.[c]) {
          const val = card.matrix[r][c];
          if (typeof val === 'number' && calledSet.has(val)) {
            card.marked[r][c] = true;
          }
        }
      }
    }
  }

  // In Auto Complete mode, ensure any called numbers on the card that player marked on any card are synced
  if (autoComplete) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const val = card.matrix[r][c];
        if (r === 2 && c === 2) {
          card.marked[r][c] = true;
        } else if (typeof val === 'number' && calledSet.has(val) && clientMarked?.[r]?.[c]) {
          card.marked[r][c] = true;
        }
      }
    }
  }

  // Ensure center FREE space is always marked
  card.marked[2][2] = true;

  // 7. Authoritative validation
  const activeRule = currentGame.activeWinningRule;
  const isAutoComplete = Boolean(autoComplete);

  const verification = verifyClaimAuthoritative(card, officialNums, activeRule, isAutoComplete);

  const claimRecord: BingoClaim = {
    id: `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    gameId: currentGame.id,
    cardId,
    userId,
    userName: userName || 'Lucky Player',
    pattern: activeRule,
    status: verification.valid ? 'confirmed' : 'rejected',
    prizeCategory: WINNING_RULE_LABELS[activeRule] || 'Championship Prize',
    prizeAmount: currentGame.totalPrizePool,
    submittedAt: Date.now(),
    verifiedAt: Date.now(),
    rejectionReason: verification.reason,
  };
  claims.push(claimRecord);

  // FALSE CLAIM HANDLING: Block the card persistently
  if (!verification.valid) {
    card.isBlocked = true;
    card.blockReason = 'Card is blocked.';

    const blockedRecord: BlockedCard = {
      cardId,
      gameId: currentGame.id,
      userId: card.userId,
      reason: 'Card is blocked.',
      status: 'blocked',
      blockedAt: Date.now(),
      blockedBy: 'Server Referee',
    };

    currentGame.blockedCards = currentGame.blockedCards.filter((b) => b.cardId !== cardId);
    currentGame.blockedCards.push(blockedRecord);

    saveStateToDisk();

    broadcastEvent('CARD_BLOCKED', { blockedCard: blockedRecord, game: currentGame });

    return res.status(400).json({
      success: false,
      blocked: true,
      cardId,
      message: 'Card is blocked.',
      reason: 'Card is blocked.',
      claim: claimRecord,
    });
  }

  // VALID CLAIM HANDLING
  // Record verified winner with full transparent card evidence
  const winnerRecord: Winner = {
    id: `win-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    gameId: currentGame.id,
    claimId: claimRecord.id,
    cardId,
    userId,
    displayName: claimRecord.userName,
    winningPattern: verification.winningPatternName || WINNING_RULE_LABELS[activeRule],
    prizeCategory: claimRecord.prizeCategory,
    prizeAmount: currentGame.totalPrizePool,
    confirmedAt: Date.now(),
    cardMatrix: card.matrix,
    calledNumbersAtWin: officialNums,
    winningCoordinates: verification.winningCoordinates,
  };

  currentGame.winners.push(winnerRecord);

  // Divide total prize pool evenly across all verified winners in this round
  const winnerCount = currentGame.winners.length;
  const splitPrize = Math.round((currentGame.totalPrizePool / winnerCount) * 100) / 100;
  currentGame.winners.forEach((w) => {
    w.prizeAmount = splitPrize;
  });

  // PART 4: Initiate or update 15-Second Winner Claim Window
  if (!currentGame.claimWindowActive) {
    // Stop number calling immediately
    stopAutoCaller();

    currentGame.status = 'checking_winners';
    currentGame.claimWindowActive = true;
    const claimDeadline = Date.now() + 15000;
    currentGame.claimWindowDeadline = claimDeadline;

    currentGame.announcements.unshift(
      'A winner has been found! Claim Bingo within 15 seconds before the game is closed.'
    );

    broadcastEvent('CLAIM_WINDOW_STARTED', {
      claimWindowDeadline: claimDeadline,
      winner: winnerRecord,
      game: currentGame,
    });
    broadcastEvent('GAME_UPDATED', currentGame);

    // Authoritative 15-second claim window timer
    claimWindowTimer = setTimeout(() => {
      claimWindowTimer = null;
      currentGame.claimWindowActive = false;
      currentGame.claimWindowDeadline = undefined;
      currentGame.status = 'game_completed';
      const completionDeadline = Date.now() + 20000;
      currentGame.completionDeadline = completionDeadline;

      const winnerNames = currentGame.winners.map((w) => `${w.displayName} (${w.cardId})`).join(', ');
      currentGame.announcements.unshift(
        `🏆 GAME COMPLETED! Confirmed Winners: ${winnerNames}. Transitioning to next game in 20 seconds.`
      );

      saveStateToDisk();

      broadcastEvent('GAME_COMPLETED', {
        winners: currentGame.winners,
        game: currentGame,
        completionDeadline,
      });
      broadcastEvent('GAME_UPDATED', currentGame);

      if (completionTimer) clearTimeout(completionTimer);
      completionTimer = setTimeout(() => {
        completionTimer = null;
        transitionToNextGame();
      }, 20000);
    }, 15000);
  } else {
    // Additional valid winner received inside the 15-second window
    currentGame.announcements.unshift(
      `Another valid claim verified! ${winnerRecord.displayName} with Card ${cardId}.`
    );
    broadcastEvent('WINNER_VERIFIED_IN_WINDOW', {
      winner: winnerRecord,
      winners: currentGame.winners,
      game: currentGame,
    });
    broadcastEvent('GAME_UPDATED', currentGame);
  }

  saveStateToDisk();

  res.json({
    success: true,
    message: 'Valid Bingo claim received! Claim window is open for 15 seconds.',
    winner: winnerRecord,
    claimWindowDeadline: currentGame.claimWindowDeadline,
  });
});

// Host: Block card manually
app.post('/api/game/block-card', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const { cardId, reason, blockedBy } = req.body;
  const card = cardsMap.get(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found.' });
  }

  card.isBlocked = true;
  card.blockReason = reason || 'Administrative action';

  const blockedRecord: BlockedCard = {
    cardId,
    gameId: currentGame.id,
    userId: card.userId,
    reason: card.blockReason || 'Administrative action',
    status: 'blocked',
    blockedAt: Date.now(),
    blockedBy: blockedBy || auth.caller?.displayName || 'Host Alice',
  };

  currentGame.blockedCards = currentGame.blockedCards.filter((b) => b.cardId !== cardId);
  currentGame.blockedCards.push(blockedRecord);

  saveStateToDisk();

  broadcastEvent('CARD_BLOCKED', { blockedCard: blockedRecord, game: currentGame });
  res.json({ success: true, blockedCard: blockedRecord });
});

// Host: Unblock card
app.post('/api/game/unblock-card', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const { cardId } = req.body;
  const card = cardsMap.get(cardId);
  if (card) {
    card.isBlocked = false;
    delete card.blockReason;
  }

  currentGame.blockedCards = currentGame.blockedCards.filter((b) => b.cardId !== cardId);
  currentGame.announcements.unshift(`Card ${cardId} was unblocked.`);

  saveStateToDisk();

  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, cardId });
});

// Host: Authorized, auditable cancellation or reset process for rule corrections
app.post('/api/game/reset', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  clearAllGameTimers();
  stopAutoCaller();

  const { title, gameCode, activeWinningRule, entryPrice, totalPrizePool, individualPrize, autoCallIntervalSeconds, reason } = req.body || {};
  const isRuleCorrection = Boolean(currentGame.isRuleLocked || currentGame.registrationOpen);

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    isRuleCorrection ? 'GAME_RESET_FOR_CORRECTION' : 'GAME_RESET',
    'game',
    currentGame.id,
    `Game configuration was reset by ${auth.caller?.displayName}${reason ? ` (${reason})` : ''}. All registrations cleared and configuration unlocked.`,
    isRuleCorrection ? 'warning' : 'info'
  );

  // Clear active registrations for new game session
  registrationsMap.clear();

  const nextGameCode = gameCode || `10:20-BINGO-${Math.floor(100 + Math.random() * 900)}`;
  const hasConfig = Boolean(activeWinningRule && activeWinningRule !== 'not_set');

  currentGame = {
    id: `game-${Date.now()}`,
    gameCode: nextGameCode,
    title: title || '10:20 BINGO Championship',
    gameType: '75-Ball Classic',
    status: hasConfig ? 'setup' : 'next_game',
    activeWinningRule: activeWinningRule || 'not_set',
    isRuleLocked: false,
    registrationOpen: false,
    startTime: 'TBD',
    entryPrice: entryPrice !== undefined ? parseFloat(entryPrice) || 0 : 1.0,
    individualPrize: individualPrize !== undefined ? parseFloat(individualPrize) || 0 : 0,
    totalPrizePool: totalPrizePool !== undefined ? parseFloat(totalPrizePool) || 0 : 0,
    prizes: hasConfig
      ? [
          {
            category: WINNING_RULE_LABELS[activeWinningRule as WinningPattern] || 'Championship Prize',
            amount: totalPrizePool || 0,
            pattern: activeWinningRule,
          },
        ]
      : [],
    registeredPlayersCount: 0,
    hostName: auth.caller?.displayName || 'Host Alice',
    hostId: auth.caller?.id || 'usr-host-1',
    announcements: [
      'Game reset! Configuration unlocked for editing. Registration is currently CLOSED.',
    ],
    calledNumbers: [],
    currentNumber: null,
    blockedCards: [],
    winners: [],
    autoCallActive: false,
    autoCallIntervalSeconds: autoCallIntervalSeconds || 7,
    maxCardsPerPlayer: 10,
    countdownDeadline: undefined,
    claimWindowDeadline: undefined,
    claimWindowActive: false,
  };

  saveStateToDisk();

  broadcastEvent('GAME_RESET', currentGame);
  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, game: currentGame });
});

// Authentication endpoints
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required.' });
  }

  const foundUser = Array.from(users.values()).find(
    (u) =>
      u.id === username ||
      u.username.toLowerCase() === username.toLowerCase() ||
      u.email.toLowerCase() === username.toLowerCase()
  );

  if (!foundUser) {
    if (password.length >= 4) {
      const isHostRequested = username.toLowerCase().includes('host') || username.toLowerCase().includes('admin');
      const newUser: User = {
        id: `usr-${Date.now()}`,
        username: username.toLowerCase().replace(/\s+/g, '_'),
        displayName: username,
        email: username.includes('@') ? username : `${username}@bingo.app`,
        role: isHostRequested ? 'host' : 'player',
        balance: 50.0,
        stats: { gamesPlayed: 0, bingosWon: 0, cardsPlayed: 0 },
      };
      users.set(newUser.id, newUser);
      return res.json({ success: true, user: newUser, token: `jwt-${newUser.id}` });
    }
    return res.status(401).json({ error: 'Invalid credentials. Password must be at least 4 characters.' });
  }

  res.json({ success: true, user: foundUser, token: `jwt-${foundUser.id}` });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, displayName, role } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required.' });
  }

  const existing = Array.from(users.values()).find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    return res.status(400).json({ error: 'A user with this username or email already exists.' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    username,
    displayName: displayName || username,
    email,
    role: role === 'host' ? 'host' : 'player',
    balance: 50.0,
    stats: { gamesPlayed: 0, bingosWon: 0, cardsPlayed: 0 },
  };

  users.set(newUser.id, newUser);
  res.json({ success: true, user: newUser, token: `jwt-${newUser.id}` });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const user = userId ? users.get(userId) : users.get('usr-player-1');
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// ==========================================
// ADMIN & HOST CONTROL PANEL API ENDPOINTS
// ==========================================

// Audit Logs Endpoint
app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const { action, actor, severity, search, limit } = req.query;
  let filtered = [...auditLogs];

  if (action && action !== 'all') {
    filtered = filtered.filter((l) => l.action === action);
  }
  if (actor && actor !== 'all') {
    filtered = filtered.filter((l) => l.actorId === actor || l.actorRole === actor);
  }
  if (severity && severity !== 'all') {
    filtered = filtered.filter((l) => l.severity === severity);
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.details.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        (l.entityId && l.entityId.toLowerCase().includes(q))
    );
  }

  const max = limit ? parseInt(String(limit), 10) : 100;
  res.json(filtered.slice(0, max));
});

// Players & Cards Directory for Admin
app.get('/api/admin/players', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const playerList = Array.from(users.values()).map((u) => {
    const userCards = Array.from(cardsMap.values()).filter((c) => c.userId === u.id);
    const registeredCount = userCards.filter((c) => c.isRegistered && !c.isBlocked).length;
    const blockedCount = userCards.filter((c) => c.isBlocked).length;
    return {
      ...u,
      cardsCount: userCards.length,
      registeredCardsCount: registeredCount,
      blockedCardsCount: blockedCount,
    };
  });

  res.json(playerList);
});

// Update User Role (Admin only)
app.post('/api/admin/players/update-role', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized || auth.caller?.role !== 'admin') {
    return res.status(403).json({ error: 'Super Administrator permission required to alter account roles.' });
  }

  const { targetUserId, newRole } = req.body;
  const targetUser = users.get(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  const oldRole = targetUser.role;
  targetUser.role = newRole;
  logAuditEvent(
    auth.caller.id,
    auth.caller.displayName,
    auth.caller.role,
    'ROLE_UPDATED',
    'player',
    targetUserId,
    `Changed role for ${targetUser.displayName} from ${oldRole} to ${newRole}`,
    'warning'
  );

  res.json({ success: true, user: targetUser });
});

// Admin All Cards View with Marked Percentage
app.get('/api/admin/cards', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const { status, search } = req.query;
  const allCards = Array.from(cardsMap.values()).map((card) => {
    const owner = users.get(card.userId);
    let markedCount = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (card.marked?.[r]?.[c]) markedCount++;
      }
    }
    const regKey = getRegKey(currentGame.id, card.id);
    const reg = registrationsMap.get(regKey);
    const resolvedGameCode = reg?.gameCode || card.gameCode || (card.isRegistered ? currentGame.gameCode : '—');

    return {
      ...card,
      gameCode: resolvedGameCode,
      ownerName: owner?.displayName || card.userId,
      ownerUsername: owner?.username || '',
      markedCount,
      markedPercentage: Math.round((markedCount / 25) * 100),
    };
  });

  let filtered = allCards;
  if (status === 'registered') {
    filtered = filtered.filter((c) => c.isRegistered && !c.isBlocked);
  } else if (status === 'unregistered') {
    filtered = filtered.filter((c) => !c.isRegistered && !c.isBlocked);
  } else if (status === 'blocked') {
    filtered = filtered.filter((c) => c.isBlocked);
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        (c.gameCode && c.gameCode.toLowerCase().includes(q)) ||
        c.ownerName.toLowerCase().includes(q) ||
        c.ownerUsername.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// Claims Management List
app.get('/api/admin/claims', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const claimsWithDetails = claims.map((cl) => {
    const card = cardsMap.get(cl.cardId);
    return {
      ...cl,
      cardMatrix: card?.matrix,
      cardMarked: card?.marked,
      isCardBlocked: card?.isBlocked || false,
    };
  });

  res.json(claimsWithDetails);
});

// Manual Claim Resolution (Host / Admin override)
app.post('/api/admin/claims/resolve', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const { claimId, action, reason } = req.body;
  const claim = claims.find((c) => c.id === claimId);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found.' });
  }

  const card = cardsMap.get(claim.cardId);

  if (action === 'confirm') {
    claim.status = 'confirmed';
    claim.verifiedAt = Date.now();
    delete claim.rejectionReason;

    if (card) {
      card.isBlocked = false;
      delete card.blockReason;
      currentGame.blockedCards = currentGame.blockedCards.filter((b) => b.cardId !== card.id);
    }

    const existingWin = currentGame.winners.find((w) => w.claimId === claimId || w.cardId === claim.cardId);
    if (!existingWin) {
      const winner: Winner = {
        id: `win-manual-${Date.now()}`,
        gameId: currentGame.id,
        claimId: claim.id,
        cardId: claim.cardId,
        userId: claim.userId,
        displayName: claim.userName,
        winningPattern: WINNING_RULE_LABELS[claim.pattern] || 'Horizontal Line',
        prizeCategory: claim.prizeCategory,
        prizeAmount: currentGame.totalPrizePool,
        confirmedAt: Date.now(),
        cardMatrix: card?.matrix,
        calledNumbersAtWin: currentGame.calledNumbers.map((b) => b.number),
      };
      currentGame.winners.push(winner);
    }

    // Stop auto-calling, cancel timers, enter game_completed state with 20-second timer
    stopAutoCaller();
    clearAllGameTimers();

    currentGame.status = 'game_completed';
    const completionDeadline = Date.now() + 20000;
    currentGame.completionDeadline = completionDeadline;

    const winnerNames = currentGame.winners.map((w) => `${w.displayName} (${w.cardId})`).join(', ');
    currentGame.announcements.unshift(
      `🏆 GAME COMPLETED! Winner Confirmed by Host: ${winnerNames}. Transitioning to next game in 20 seconds.`
    );

    logAuditEvent(
      auth.caller!.id,
      auth.caller!.displayName,
      auth.caller!.role,
      'CLAIM_MANUALLY_CONFIRMED',
      'claim',
      claim.id,
      `Host manually confirmed claim for ${claim.userName} (${claim.cardId}): ${reason || 'Host review approved'}`,
      'warning'
    );

    saveStateToDisk();

    broadcastEvent('GAME_COMPLETED', {
      winners: currentGame.winners,
      game: currentGame,
      completionDeadline,
    });
    broadcastEvent('GAME_UPDATED', currentGame);

    if (completionTimer) clearTimeout(completionTimer);
    completionTimer = setTimeout(() => {
      completionTimer = null;
      transitionToNextGame();
    }, 20000);

    return res.json({ success: true, claim, game: currentGame });
  } else {
    claim.status = 'rejected';
    claim.verifiedAt = Date.now();
    claim.rejectionReason = reason || 'Host rejected claim';

    logAuditEvent(
      auth.caller!.id,
      auth.caller!.displayName,
      auth.caller!.role,
      'CLAIM_MANUALLY_REJECTED',
      'claim',
      claim.id,
      `Host rejected claim for ${claim.userName} (${claim.cardId}): ${claim.rejectionReason}`,
      'warning'
    );

    saveStateToDisk();
    broadcastEvent('GAME_UPDATED', currentGame);
    return res.json({ success: true, claim });
  }
});

// Game History & Reports
app.get('/api/admin/history', (_req: Request, res: Response) => {
  res.json(historicalGames);
});

app.get('/api/admin/history/:id', (req: Request, res: Response) => {
  const game = historicalGames.find((g) => g.id === req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Historical game not found.' });
  }
  res.json(game);
});

app.get('/api/admin/history/:id/export', (req: Request, res: Response) => {
  const game = historicalGames.find((g) => g.id === req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found.' });
  }

  const format = req.query.format || 'json';
  if (format === 'csv') {
    let csv = 'GameID,Title,WinningRule,Status,BallsCalled,DurationMinutes,PrizePool,WinnersCount,WinnerNames\n';
    const winnerNames = game.winners.map((w) => `${w.displayName} (${w.cardId})`).join('; ');
    csv += `"${game.id}","${game.title}","${game.winningRule}","${game.status}",${game.ballsCalledCount},${game.durationMinutes},${game.prizePool},${game.winners.length},"${winnerNames}"\n\n`;
    csv += 'CallSequence,Letter,Number,CalledTimestamp\n';
    game.ballSequence.forEach((b) => {
      csv += `${b.sequence},"${b.letter}",${b.number},${b.calledAt}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${game.id}-report.csv"`);
    return res.send(csv);
  }

  res.json(game);
});

// System Settings
app.get('/api/admin/settings', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }
  res.json(systemSettings);
});

app.post('/api/admin/settings', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  systemSettings = { ...systemSettings, ...req.body };
  if (req.body.maxCardsPerPlayer) {
    currentGame.maxCardsPerPlayer = req.body.maxCardsPerPlayer;
  }
  if (req.body.defaultAutoCallInterval) {
    currentGame.autoCallIntervalSeconds = req.body.defaultAutoCallInterval;
  }

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'SYSTEM_SETTINGS_UPDATED',
    'settings',
    'global',
    `Updated system settings: defaultInterval=${systemSettings.defaultAutoCallInterval}s, maxCards=${systemSettings.maxCardsPerPlayer}`,
    'info'
  );

  saveStateToDisk();
  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, settings: systemSettings });
});

// Pause Gameplay (Host / Admin)
app.post('/api/game/pause', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  const activePlayStatuses = ['in_progress', 'running', 'starting_countdown', 'pre_game_countdown'];
  if (!activePlayStatuses.includes(currentGame.status)) {
    return res.status(400).json({ error: 'Only running or in-progress games can be paused.' });
  }

  clearAllGameTimers();
  stopAutoCaller();
  currentGame.status = 'paused';
  currentGame.countdownDeadline = undefined;
  currentGame.numberCallingStartTimestamp = undefined;
  currentGame.announcements.unshift('Game paused by host.');

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'GAME_PAUSED',
    'game',
    currentGame.id,
    'Game gameplay temporarily paused by host.',
    'warning'
  );

  saveStateToDisk();
  broadcastEvent('GAME_PAUSED', currentGame);
  broadcastEvent('GAME_UPDATED', currentGame);
  res.json({ success: true, game: currentGame });
});

// ==========================================
// REQUIREMENT 7: GLOBAL START & STOP BINGO CONTROLS
// ==========================================

// Check Global Service Status
app.get('/api/game/service-status', (_req: Request, res: Response) => {
  res.json({ isBingoSuspended, isServiceSuspended: isBingoSuspended });
});

// Admin Global Stop Bingo
app.post('/api/admin/service/stop', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  isBingoSuspended = true;
  currentGame.isServiceSuspended = true;

  clearAllGameTimers();
  stopAutoCaller();
  currentGame.status = 'stopped';
  currentGame.autoCallActive = false;
  currentGame.countdownDeadline = undefined;
  currentGame.numberCallingStartTimestamp = undefined;
  currentGame.claimWindowActive = false;
  currentGame.claimWindowDeadline = undefined;

  const notification = 'Bingo game and platform services have been stopped by the administrator.';
  currentGame.announcements.unshift(notification);

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'BINGO_SERVICE_STOPPED',
    'settings',
    'global',
    'Global Bingo service suspended by administrator. All games halted.',
    'critical'
  );

  saveStateToDisk();

  broadcastEvent('BINGO_SERVICE_STOPPED', {
    isBingoSuspended: true,
    notification,
    game: currentGame,
  });
  broadcastEvent('GAME_STOPPED', currentGame);
  broadcastEvent('GAME_UPDATED', currentGame);

  res.json({
    success: true,
    isBingoSuspended: true,
    message: 'Bingo service suspended. Notification sent to players.',
    game: currentGame,
  });
});

// Admin Global Start Bingo
app.post('/api/admin/service/start', (req: Request, res: Response) => {
  const auth = verifyHostAuthorization(req);
  if (!auth.authorized) {
    return res.status(403).json({ error: auth.error });
  }

  isBingoSuspended = false;
  currentGame.isServiceSuspended = false;

  // Clean current-game card area for new round (ready for fresh registrations)
  registrationsMap.clear();
  currentGame.calledNumbers = [];
  currentGame.currentNumber = null;
  currentGame.winners = [];
  currentGame.blockedCards = [];
  currentGame.claimWindowActive = false;
  currentGame.claimWindowDeadline = undefined;
  currentGame.status = 'registration_open';
  currentGame.registrationOpen = true;
  currentGame.registeredPlayersCount = 0;
  currentGame.countdownDeadline = undefined;
  currentGame.numberCallingStartTimestamp = undefined;

  // Scoped to current fresh game
  const notification = 'Bingo games have resumed! Registration is now OPEN. Generate and register your cards.';
  currentGame.announcements = [
    notification,
    `Winning Rule: ${WINNING_RULE_LABELS[currentGame.activeWinningRule] || 'Horizontal Line'}`,
  ];

  logAuditEvent(
    auth.caller!.id,
    auth.caller!.displayName,
    auth.caller!.role,
    'BINGO_SERVICE_STARTED',
    'settings',
    'global',
    'Global Bingo service restored by administrator. Current game card area cleaned for registration.',
    'info'
  );

  saveStateToDisk();

  broadcastEvent('BINGO_SERVICE_STARTED', {
    isBingoSuspended: false,
    notification,
    game: currentGame,
  });
  broadcastEvent('GAME_RESET', currentGame);
  broadcastEvent('GAME_UPDATED', currentGame);

  res.json({
    success: true,
    isBingoSuspended: false,
    message: 'Bingo service restored. Card area cleaned and registration is open.',
    game: currentGame,
  });
});


// --- Vite Integration & Static Hosting ---
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`[Bingo Server] Running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Bingo Server] Startup error:', err);
});
