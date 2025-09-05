import { ReactNode } from 'react';

// Professional Cricket Scoring Application - Type Definitions

export interface Player {
  id: string;
  name: string;
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';
  battingStats: BattingStats;
  bowlingStats: BowlingStats;
  fieldingStats: FieldingStats;
}

export interface BattingStats {
  status: ReactNode;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalType?: DismissalType;
  dismissedBy?: string;
  isRetiredHurt: boolean;
}

export interface BowlingStats {
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  economyRate: number;
  wides: number;
  noBalls: number;
}

export interface FieldingStats {
  catches: number;
  runOuts: number;
  stumpings: number;
}

export interface Team {
  id: string;
  name: string;
  fullRoster: Player[];
  playingXI: Player[];
  captain?: string;
  wicketKeeper?: string;
}

export interface Ball {
  id: string;
  ballNumber: number;
  over: number;
  bowler: string;
  batsman: string;
  runs: number;
  isExtra: boolean;
  extraType?: ExtraType;
  extraRuns?: number;
  isWicket: boolean;
  dismissalType?: DismissalType;
  dismissedPlayer?: string;
  newBatsman?: string;
  commentary: string;
  timestamp: Date;
}

export interface Over {
  number: number;
  overNumber: number;
  bowler: string;
  balls: Ball[];
  runs: number;
  wickets: number;
  extras: number;
}

export interface CommentaryEntry {
  over: number;
  ball: number;
  timestamp: string;
  text: string;
  runs?: number;
  isWicket?: boolean;
  isExtra?: boolean;
}

export interface Innings {
  number: 1 | 2;
  battingTeam: string;
  bowlingTeam: string;
  score: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: number;
  target?: number;
  isComplete: boolean;
  completionReason?: 'allOut' | 'oversComplete' | 'targetReached';
  currentBatsmen: {
    striker: string;
    nonStriker: string;
  };
  currentBowler: string;
  overHistory: Over[];
  ballHistory: Ball[];
  powerPlayOvers?: number[];  // For power play tracking
  dlsResource?: number;       // For DLS calculations
  phaseStats?: {             // For phase-wise analysis
    powerplay: PhaseStats;
    middle: PhaseStats;
    death: PhaseStats;
  };
  partnerships: Partnership[];
  wagonWheel?: WagonWheelData[];
  pitchMap?: PitchMapData[];
  commentary: CommentaryEntry[];
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  totalOvers: number;
  tossWinner?: string;
  tossDecision?: 'bat' | 'bowl';
  battingFirst?: string;
  currentInnings: 1 | 2;
  innings: {
    first?: Innings;
    second?: Innings;
  };
  isLive: boolean;
  isComplete: boolean;
  winner?: string;
  result?: string;
  awards?: {
    bestBatsman?: Player;
    bestBowler?: Player;
    manOfTheMatch?: Player;
  };
  matchType: 'T20' | 'ODI' | 'Test' | 'Custom';
  venue?: string;
  date: Date;
  umpires?: string[];
}

export interface ScoringEvent {
  type: 'run' | 'extra' | 'wicket' | 'penalty';
  runs: number;
  extraType?: ExtraType;
  dismissalType?: DismissalType;
  commentary?: string;
}

export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty' | 'noball-bye' | 'noball-legbye';

export type DismissalType = 
  | 'bowled' 
  | 'caught' 
  | 'lbw' 
  | 'runOut' 
  | 'stumped' 
  | 'hitWicket' 
  | 'obstructingField' 
  | 'handledBall' 
  | 'timedOut' 
  | 'retiredHurt';

export interface MatchState {
  match: Match;
  canUndo: boolean;
  undoHistory: ScoringEvent[];
  currentOver: Ball[];
  pendingActions: string[];
}

export interface PlayerSelection {
  team: string;
  availablePlayers: Player[];
  selectedPlayers: Player[];
  requiredCount: number;
  selectionType: 'playingXI' | 'openingBatsmen' | 'newBatsman' | 'bowler';
}

// Utility types for UI components
export interface ScoreboardData {
  currentScore: string;
  currentBatsmen: {
    striker: { name: string; runs: number; balls: number; strikeRate: number };
    nonStriker: { name: string; runs: number; balls: number; strikeRate: number };
  };
  currentBowler: {
    name: string;
    overs: string;
    runs: number;
    wickets: number;
    economyRate: number;
  };
  recentOvers: string[];
  currentOver: string[];
  target?: number;
  required?: { runs: number; balls: number; rate: number };
}

export interface WagonWheelData {
  batsman: string;
  shots: Array<{
    runs: number;
    angle: number;
    distance: number;
    ballNumber: number;
  }>;
}

export interface PhaseStats {
  runs: number;
  balls: number;
  wickets: number;
  dots: number;
  boundaries: {
    fours: number;
    sixes: number;
  };
  runRate: number;
}

export interface Partnership {
  batsmen: [string, string];
  runs: number;
  balls: number;
  startOver: number;
  endOver?: number;
  isUnbroken: boolean;
}



export interface PitchMapData {
  bowler: string;
  deliveries: Array<{
    line: 'wide' | 'off' | 'middle' | 'leg' | 'down-leg';
    length: 'bouncer' | 'short' | 'good' | 'full' | 'yorker';
    runs: number;
    isWicket: boolean;
    speed?: number;
    swing?: 'in' | 'out' | 'none';
    spin?: 'turn-in' | 'turn-away' | 'none';
    timestamp: Date;
    batsman: string;
  }>;
}
