// Cricket Constants - Eliminates magic numbers throughout the application

export const CRICKET_CONSTANTS = {
  // Basic cricket rules
  BALLS_PER_OVER: 6,
  BOUNDARY_FOUR: 4,
  BOUNDARY_SIX: 6,
  MAX_WICKETS_STANDARD: 10,
  
  // Match formats
  T20_OVERS: 20,
  ODI_OVERS: 50,
  TEST_OVERS: 90, // Per day
  
  // Powerplay overs
  T20_POWERPLAY_OVERS: 6,
  ODI_POWERPLAY_OVERS: 10,
  
  // Scoring limits
  MAX_RUNS_PER_BALL: 6,
  MAX_EXTRAS_PER_BALL: 5,
  
  // UI Constants
  ANIMATION_DURATION: 1000,
  BOUNDARY_ANIMATION_DURATION: 2000,
  TOAST_DURATION: 4000,
  
  // Validation limits
  MIN_TEAM_SIZE: 11,
  MAX_TEAM_SIZE: 15,
  MIN_OVERS: 1,
  MAX_OVERS: 50,
  
  // Strike rates
  EXCELLENT_STRIKE_RATE: 150,
  GOOD_STRIKE_RATE: 120,
  AVERAGE_STRIKE_RATE: 100,
  
  // Economy rates
  EXCELLENT_ECONOMY: 6.0,
  GOOD_ECONOMY: 7.0,
  AVERAGE_ECONOMY: 8.0,
} as const;

export const DISMISSAL_TYPES = {
  BOWLED: 'bowled',
  CAUGHT: 'caught',
  LBW: 'lbw',
  RUN_OUT: 'runOut',
  STUMPED: 'stumped',
  HIT_WICKET: 'hitWicket',
  OBSTRUCTING_FIELD: 'obstructingField',
  HANDLED_BALL: 'handledBall',
  TIMED_OUT: 'timedOut',
  RETIRED_HURT: 'retiredHurt',
} as const;

export const EXTRA_TYPES = {
  WIDE: 'wide',
  NO_BALL: 'noball',
  BYE: 'bye',
  LEG_BYE: 'legbye',
  PENALTY: 'penalty',
  NO_BALL_BYE: 'noball-bye',
  NO_BALL_LEG_BYE: 'noball-legbye',
} as const;

export const PLAYER_ROLES = {
  BATSMAN: 'batsman',
  BOWLER: 'bowler',
  ALL_ROUNDER: 'allrounder',
  WICKET_KEEPER: 'wicketkeeper',
} as const;

export const MATCH_PHASES = {
  POWERPLAY: 'powerplay',
  MIDDLE: 'middle',
  DEATH: 'death',
} as const;

// Helper functions for common cricket calculations
export const cricketUtils = {
  // Calculate strike rate
  calculateStrikeRate: (runs: number, ballsFaced: number): number => {
    return ballsFaced > 0 ? (runs / ballsFaced) * 100 : 0;
  },

  // Calculate economy rate
  calculateEconomyRate: (runs: number, overs: number, balls: number): number => {
    const totalOvers = overs + (balls / CRICKET_CONSTANTS.BALLS_PER_OVER);
    return totalOvers > 0 ? runs / totalOvers : 0;
  },

  // Calculate run rate
  calculateRunRate: (runs: number, overs: number, balls: number): number => {
    const totalOvers = overs + (balls / CRICKET_CONSTANTS.BALLS_PER_OVER);
    return totalOvers > 0 ? runs / totalOvers : 0;
  },

  // Calculate required run rate
  calculateRequiredRunRate: (target: number, currentScore: number, oversLeft: number, ballsLeft: number): number => {
    const runsRequired = target - currentScore;
    const oversRemaining = oversLeft + (ballsLeft / CRICKET_CONSTANTS.BALLS_PER_OVER);
    return oversRemaining > 0 ? runsRequired / oversRemaining : 0;
  },

  // Format overs display
  formatOvers: (overs: number, balls: number): string => {
    return `${overs}.${balls}`;
  },

  // Get match phase based on overs
  getMatchPhase: (overs: number, totalOvers: number): string => {
    const overPercentage = (overs / totalOvers) * 100;
    
    if (overPercentage <= 30) return MATCH_PHASES.POWERPLAY;
    if (overPercentage <= 80) return MATCH_PHASES.MIDDLE;
    return MATCH_PHASES.DEATH;
  },

  // Validate scoring action
  isValidScoringAction: (runs: number, isExtra: boolean): boolean => {
    if (isExtra) {
      return runs >= 1 && runs <= CRICKET_CONSTANTS.MAX_EXTRAS_PER_BALL;
    }
    return runs >= 0 && runs <= CRICKET_CONSTANTS.MAX_RUNS_PER_BALL;
  },

  // Get maximum wickets for team size
  getMaxWickets: (teamSize: number): number => {
    return Math.max(1, teamSize - 1);
  },

  // Check if powerplay is active
  isPowerplayActive: (overs: number, matchFormat: string): boolean => {
    const powerplayOvers = matchFormat === 'T20' 
      ? CRICKET_CONSTANTS.T20_POWERPLAY_OVERS 
      : CRICKET_CONSTANTS.ODI_POWERPLAY_OVERS;
    
    return overs < powerplayOvers;
  },

  // Calculate match result
  calculateMatchResult: (match: any): { winner: string; result: string } => {
    const firstInningsScore = match.innings.first?.score || 0;
    const secondInningsScore = match.innings.second?.score || 0;
    
    // Determine which team batted first and second based on toss
    const firstBattingTeam = match.battingFirst === match.team1.name ? match.team1.name : match.team2.name;
    const secondBattingTeam = match.battingFirst === match.team1.name ? match.team2.name : match.team1.name;
    
    if (secondInningsScore > firstInningsScore) {
      // Chasing team (batting second) won
      const wicketsLeft = (match.battingFirst === match.team1.name ? match.team2.playingXI.length : match.team1.playingXI.length) - (match.innings.second?.wickets || 0);
      return {
        winner: secondBattingTeam,
        result: `${secondBattingTeam} won by ${wicketsLeft} wickets`
      };
    } else if (firstInningsScore > secondInningsScore) {
      // First batting team won
      const runMargin = firstInningsScore - secondInningsScore;
      return {
        winner: firstBattingTeam,
        result: `${firstBattingTeam} won by ${runMargin} runs`
      };
    } else {
      return {
        winner: 'Tie',
        result: 'Match Tied'
      };
    }
  },

  // Generate ball commentary
  generateBallCommentary: (runs: number, isExtra: boolean, extraType?: string): string => {
    if (isExtra) {
      switch (extraType) {
        case EXTRA_TYPES.WIDE:
          return runs > 1 ? `WIDE! ${runs - 1} runs added.` : 'WIDE! Down the leg side.';
        case EXTRA_TYPES.NO_BALL:
          return runs > 1 ? `NO BALL! ${runs - 1} runs off the free hit.` : 'NO BALL! Free hit coming up!';
        case EXTRA_TYPES.BYE:
          return `${runs} BYE${runs > 1 ? 'S' : ''}! Sneaks past the keeper.`;
        case EXTRA_TYPES.LEG_BYE:
          return `${runs} LEG BYE${runs > 1 ? 'S' : ''}! Off the pads.`;
        default:
          return `${runs} extra${runs > 1 ? 's' : ''}.`;
      }
    }

    switch (runs) {
      case 0:
        return Math.random() > 0.5 ? 'Dot ball, well bowled!' : 'Defended solidly.';
      case 1:
        return Math.random() > 0.5 ? 'Takes a quick single.' : 'Nudged for one.';
      case 2:
        return Math.random() > 0.5 ? 'Good running, two runs!' : 'Placed in the gap for two.';
      case 3:
        return 'Excellent running, three runs! Great placement.';
      case 4:
        const fourComments = [
          'FOUR! Cracking shot through the covers!',
          'FOUR! Timed to perfection!',
          'FOUR! Finds the gap beautifully!',
          'FOUR! What a stroke!'
        ];
        return fourComments[Math.floor(Math.random() * fourComments.length)];
      case 6:
        const sixComments = [
          'SIX! That\'s absolutely massive!',
          'SIX! Into the stands!',
          'SIX! Clean as a whistle!',
          'SIX! What a shot! The crowd is on its feet!'
        ];
        return sixComments[Math.floor(Math.random() * sixComments.length)];
      default:
        return `${runs} runs, good cricket!`;
    }
  }
};
