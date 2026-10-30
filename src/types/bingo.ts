export type BingoColumn = 'B' | 'I' | 'N' | 'G' | 'O';

export interface BingoBall {
  letter: BingoColumn;
  number: number;
  color: string;
  calledAt: number;
  sequence: number;
}

export type WinningPattern =
  | 'not_set'
  | 'horizontal_line'
  | 'vertical_line'
  | 'diagonal_line'
  | 'four_corners'
  | 'blackout';

export type GameStatus =
  | 'next_game'
  | 'setup'
  | 'registration_open'
  | 'registration_closed'
  | 'starting_countdown'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'claim_review'
  | 'game_completed'
  | 'cancelled'
  // Legacy status aliases for backward compatibility:
  | 'ready_to_start'
  | 'pre_game_countdown'
  | 'in_progress'
  | 'checking_winners'
  | 'winner_confirmed'
  | 'completed';

export interface BingoCard {
  id: string;
  gameId: string;
  gameCode?: string;
  userId: string;
  matrix: (number | 'FREE')[][]; // 5 rows x 5 cols
  marked: boolean[][]; // 5x5 boolean
  isRegistered: boolean;
  registeredAt?: number;
  isBlocked: boolean;
  blockReason?: string;
  createdAt: number;
  cardDateString: string; // YYYY-MM-DD in local time
  isArchived?: boolean;
}

export interface CardRegistration {
  id: string;
  gameId: string;
  gameCode: string;
  cardId: string;
  userId: string;
  registeredAt: number;
}

export interface BlockedCard {
  cardId: string;
  gameId: string;
  userId?: string;
  reason: string;
  status: 'blocked' | 'under_review';
  blockedAt: number;
  blockedBy: string;
}

export interface Winner {
  id: string;
  gameId: string;
  claimId: string;
  cardId: string;
  userId: string;
  displayName: string;
  winningPattern: string;
  prizeCategory: string;
  prizeAmount: number;
  confirmedAt: number;
  cardMatrix?: (number | 'FREE')[][]; // For full card transparency
  calledNumbersAtWin?: number[]; // Numbers called when won
  winningCoordinates?: [number, number][]; // Cells in winning pattern
}

export interface BingoClaim {
  id: string;
  gameId: string;
  cardId: string;
  userId: string;
  userName: string;
  pattern: WinningPattern;
  status: 'submitted' | 'under_verification' | 'confirmed' | 'rejected';
  prizeCategory: string;
  prizeAmount: number;
  submittedAt: number;
  verifiedAt?: number;
  rejectionReason?: string;
}

export interface PrizeTier {
  category: string;
  amount: number;
  pattern: WinningPattern;
}

export interface GameSession {
  id: string;
  gameCode: string;
  title: string;
  gameType: string;
  status: GameStatus;
  activeWinningRule: WinningPattern; // Single active winning rule for the shared game
  isRuleLocked: boolean; // Locked once registration opens
  registrationOpen: boolean;
  startTime: string;
  entryPrice: number;
  individualPrize: number; // Stored separately from total prize pool
  totalPrizePool: number; // Stored separately from individual prize
  prizes: PrizeTier[];
  registeredPlayersCount: number;
  hostName: string;
  hostId: string;
  announcements: string[];
  calledNumbers: BingoBall[];
  currentNumber: BingoBall | null;
  blockedCards: BlockedCard[];
  winners: Winner[];
  autoCallActive: boolean;
  autoCallIntervalSeconds: number; // 5-15s, default 7s
  maxCardsPerPlayer: number;
  countdownDeadline?: number; // Pre-game 15s countdown end timestamp
  numberCallingStartTimestamp?: number; // Start of calling after 5s post-countdown delay
  claimWindowDeadline?: number; // 15s winner claim window end timestamp
  claimWindowActive?: boolean;
  completionDeadline?: number; // Exact 20-second Game Completed end timestamp
  isServiceSuspended?: boolean; // Global admin Stop/Start Bingo service state
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'player' | 'host' | 'admin';
  balance: number;
  stats: {
    gamesPlayed: number;
    bingosWon: number;
    cardsPlayed: number;
  };
}

export interface CellCoord {
  cardId: string;
  row: number;
  col: number;
}

export interface LocalUndoAction {
  type: 'MARK_CELL' | 'UNMARK_CELL';
  cardId: string;
  row: number;
  col: number;
  syncedCells?: CellCoord[];
  number?: number;
  timestamp: number;
}

export interface UserPreferences {
  soundEnabled: boolean;
  voiceCallerEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  customAppName: string;
  autoComplete: boolean; // Explicit toggle for automatically marking called numbers
  gridColumns: number; // 1, 2, or 3 columns
  sortBy: 'id' | 'recent' | 'registration' | 'marked';
  notificationsEnabled: boolean;
}

export type AdminNavigationTab =
  | 'overview'
  | 'setup'
  | 'live-control'
  | 'players-cards'
  | 'claims'
  | 'winners'
  | 'history'
  | 'settings'
  | 'audit-logs';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actorId: string;
  actorName: string;
  actorRole: 'admin' | 'host' | 'system' | 'player';
  action: string;
  entityType: 'game' | 'card' | 'claim' | 'winner' | 'player' | 'settings';
  entityId?: string;
  details: string;
  severity?: 'info' | 'warning' | 'critical';
}

export interface HistoricalGame {
  id: string;
  gameCode: string;
  title: string;
  completedAt: number;
  durationMinutes: number;
  winningRule: WinningPattern;
  ballsCalledCount: number;
  registeredPlayersCount: number;
  totalCardsCount: number;
  individualPrize?: number;
  prizePool: number;
  status: 'completed' | 'cancelled';
  winners: Winner[];
  ballSequence: BingoBall[];
}

export interface SystemSettings {
  defaultAutoCallInterval: number;
  maxCardsPerPlayer: number;
  claimWindowDurationSeconds: number;
  countdownDurationSeconds: number;
  autoCallInitialDelaySeconds: number;
  defaultPrizeAmount: number;
  defaultEntryPrice: number;
  requireManualClaimVerification: boolean;
  autoBlockFalseClaims: boolean;
  announcementsEnabled: boolean;
  maintenanceMode: boolean;
}
