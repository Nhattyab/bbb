import { BingoBall, BingoCard, BingoColumn, WinningPattern } from '../types/bingo';

export const COLUMN_RANGES: Record<BingoColumn, { min: number; max: number }> = {
  B: { min: 1, max: 15 },
  I: { min: 16, max: 30 },
  N: { min: 31, max: 45 },
  G: { min: 46, max: 60 },
  O: { min: 61, max: 75 },
};

export const COLUMN_COLORS: Record<BingoColumn, { bg: string; text: string; border: string; hex: string }> = {
  B: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', hex: '#2563eb' },
  I: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', hex: '#e11d48' },
  N: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', hex: '#059669' },
  G: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', hex: '#9333ea' },
  O: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', hex: '#d97706' },
};

export const WINNING_RULE_LABELS: Record<WinningPattern, string> = {
  not_set: 'Not Set',
  horizontal_line: 'Horizontal Line (Any complete row)',
  vertical_line: 'Vertical Line (Any complete column)',
  diagonal_line: 'Diagonal Line (Corner to corner)',
  four_corners: 'Four Corners (All 4 outer corners)',
  blackout: 'Full Card / Blackout (All 25 squares)',
};

export function getLetterForNumber(num: number): BingoColumn {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  throw new Error(`Invalid bingo number: ${num}. Must be 1-75.`);
}

export function createBall(num: number, sequence: number = 1): BingoBall {
  const letter = getLetterForNumber(num);
  return {
    letter,
    number: num,
    color: COLUMN_COLORS[letter].hex,
    calledAt: Date.now(),
    sequence,
  };
}

function getRandomInts(min: number, max: number, count: number): number[] {
  const pool: number[] = [];
  for (let i = min; i <= max; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function generateBingoCard(
  gameId: string,
  userId: string,
  cardIndex: number,
  isRegistered: boolean = false
): BingoCard {
  const cardId = `CARD-${Math.floor(1000 + Math.random() * 9000)}-${cardIndex}`;

  const colB = getRandomInts(1, 15, 5);
  const colI = getRandomInts(16, 30, 5);
  const colN = getRandomInts(31, 45, 5);
  const colG = getRandomInts(46, 60, 5);
  const colO = getRandomInts(61, 75, 5);

  const matrix: (number | 'FREE')[][] = [];
  const marked: boolean[][] = [];

  for (let r = 0; r < 5; r++) {
    const rowNumbers: (number | 'FREE')[] = [
      colB[r],
      colI[r],
      r === 2 ? 'FREE' : colN[r],
      colG[r],
      colO[r],
    ];
    matrix.push(rowNumbers);
    marked.push([false, false, r === 2, false, false]); // Center is FREE and marked by default
  }

  const now = new Date();
  const cardDateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  return {
    id: cardId,
    gameId,
    userId,
    matrix,
    marked,
    isRegistered,
    registeredAt: isRegistered ? Date.now() : undefined,
    isBlocked: false,
    createdAt: Date.now(),
    cardDateString,
    isArchived: false,
  };
}

export interface PatternCheckResult {
  isWon: boolean;
  patternName: string;
  winningCoordinates: [number, number][];
}

export function checkWinningPattern(
  marked: boolean[][],
  pattern: WinningPattern
): PatternCheckResult {
  const isMarked = (r: number, c: number) => (r === 2 && c === 2) || !!marked[r]?.[c];

  // 1. Horizontal lines
  const horizontalWins: [number, number][][] = [];
  for (let r = 0; r < 5; r++) {
    let rowWon = true;
    const coords: [number, number][] = [];
    for (let c = 0; c < 5; c++) {
      if (!isMarked(r, c)) {
        rowWon = false;
        break;
      }
      coords.push([r, c]);
    }
    if (rowWon) horizontalWins.push(coords);
  }

  // 2. Vertical lines
  const verticalWins: [number, number][][] = [];
  for (let c = 0; c < 5; c++) {
    let colWon = true;
    const coords: [number, number][] = [];
    for (let r = 0; r < 5; r++) {
      if (!isMarked(r, c)) {
        colWon = false;
        break;
      }
      coords.push([r, c]);
    }
    if (colWon) verticalWins.push(coords);
  }

  // 3. Diagonal lines
  const diag1Coords: [number, number][] = [];
  let diag1Won = true;
  for (let i = 0; i < 5; i++) {
    if (!isMarked(i, i)) {
      diag1Won = false;
      break;
    }
    diag1Coords.push([i, i]);
  }

  const diag2Coords: [number, number][] = [];
  let diag2Won = true;
  for (let i = 0; i < 5; i++) {
    if (!isMarked(i, 4 - i)) {
      diag2Won = false;
      break;
    }
    diag2Coords.push([i, 4 - i]);
  }

  // 4. Four corners
  const fourCornersCoords: [number, number][] = [
    [0, 0],
    [0, 4],
    [4, 0],
    [4, 4],
  ];
  const fourCornersWon = fourCornersCoords.every(([r, c]) => isMarked(r, c));

  // 5. Full card / Blackout
  const blackoutCoords: [number, number][] = [];
  let blackoutWon = true;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (!isMarked(r, c)) {
        blackoutWon = false;
      }
      blackoutCoords.push([r, c]);
    }
  }

  switch (pattern) {
    case 'horizontal_line':
      return {
        isWon: horizontalWins.length > 0,
        patternName: 'Horizontal Line',
        winningCoordinates: horizontalWins[0] || [],
      };
    case 'vertical_line':
      return {
        isWon: verticalWins.length > 0,
        patternName: 'Vertical Line',
        winningCoordinates: verticalWins[0] || [],
      };
    case 'diagonal_line':
      return {
        isWon: diag1Won || diag2Won,
        patternName: 'Diagonal Line',
        winningCoordinates: diag1Won ? diag1Coords : diag2Coords,
      };
    case 'four_corners':
      return {
        isWon: fourCornersWon,
        patternName: 'Four Corners',
        winningCoordinates: fourCornersWon ? fourCornersCoords : [],
      };
    case 'blackout':
      return {
        isWon: blackoutWon,
        patternName: 'Full Card / Blackout',
        winningCoordinates: blackoutWon ? blackoutCoords : [],
      };
    default:
      return { isWon: false, patternName: 'Unknown Pattern', winningCoordinates: [] };
  }
}

/**
 * Server-side / Authoritative validation of Bingo claim against official called numbers and active rule.
 * Free space center is always considered covered.
 * Reconciles persisted markings and client markings against official called numbers to prevent race conditions.
 */
export function verifyClaimAuthoritative(
  card: BingoCard,
  officialCalledNumbers: number[],
  requiredPattern: WinningPattern,
  autoCompleteEnabled: boolean = false,
  clientMarked?: boolean[][]
): {
  valid: boolean;
  reason: string;
  diagnostics?: string;
  winningPatternName?: string;
  winningCoordinates?: [number, number][];
} {
  if (card.isBlocked) {
    return { valid: false, reason: 'Card is blocked.', diagnostics: 'Card was already flagged as blocked.' };
  }

  if (!card.isRegistered) {
    return { valid: false, reason: 'Card is blocked.', diagnostics: 'Card is not registered for the active game session.' };
  }

  const calledSet = new Set(officialCalledNumbers);

  // A cell is verified marked IF AND ONLY IF:
  // 1. It is the center FREE space (r=2, c=2 or 'FREE') OR
  // 2. The number was officially called AND (it is marked on this card OR marked on client)
  const verifiedMarked: boolean[][] = [];
  const uncalledMarkedDetails: string[] = [];

  for (let r = 0; r < 5; r++) {
    const rowMarked: boolean[] = [];
    for (let c = 0; c < 5; c++) {
      const val = card.matrix[r][c];
      const isCenter = (r === 2 && c === 2) || val === 'FREE';
      if (isCenter) {
        rowMarked.push(true);
      } else {
        const isCalled = typeof val === 'number' && calledSet.has(val);
        const isPlayerMarked = Boolean(card.marked?.[r]?.[c] || clientMarked?.[r]?.[c]);
        const cellCovered = isCalled && isPlayerMarked;
        rowMarked.push(cellCovered);

        if (isPlayerMarked && !isCalled) {
          uncalledMarkedDetails.push(`Cell [${r},${c}] (#${val}) marked but NOT called`);
        }
      }
    }
    verifiedMarked.push(rowMarked);
  }

  const patternResult = checkWinningPattern(verifiedMarked, requiredPattern);
  if (!patternResult.isWon) {
    const diagnosticMsg = `Pattern '${requiredPattern}' not satisfied. Officially called count: ${officialCalledNumbers.length}. ${
      uncalledMarkedDetails.length > 0 ? `Uncalled marks: ${uncalledMarkedDetails.join(', ')}. ` : ''
    }Required coordinates for pattern incomplete.`;

    return {
      valid: false,
      reason: 'Card is blocked.',
      diagnostics: diagnosticMsg,
    };
  }

  return {
    valid: true,
    reason: 'Valid Bingo claim confirmed.',
    winningPatternName: patternResult.patternName,
    winningCoordinates: patternResult.winningCoordinates,
  };
}
