import { Match, Innings, Player, Team } from '@/types/cricket';
import { CRICKET_CONSTANTS, cricketUtils } from '@/constants/cricket';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Scoring action validation
export interface ScoringAction {
  runs: number;
  isExtra: boolean;
  extraType?: string;
  dismissalType?: string;
}

export const validationUtils = {
  // Validate scoring action
  validateScoringAction: (action: ScoringAction, match: Match): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if match is complete
    if (match.isComplete) {
      errors.push("Cannot score on a completed match");
    }

    // Check if match is live
    if (!match.isLive) {
      errors.push("Match is not currently live");
    }

    // Validate run count
    if (action.isExtra) {
      if (action.runs < 1 || action.runs > CRICKET_CONSTANTS.MAX_EXTRAS_PER_BALL) {
        errors.push(`Invalid extra runs: ${action.runs}. Must be between 1 and ${CRICKET_CONSTANTS.MAX_EXTRAS_PER_BALL}`);
      }
    } else {
      if (action.runs < 0 || action.runs > CRICKET_CONSTANTS.MAX_RUNS_PER_BALL) {
        errors.push(`Invalid runs: ${action.runs}. Must be between 0 and ${CRICKET_CONSTANTS.MAX_RUNS_PER_BALL}`);
      }
    }

    // Validate current innings exists
    const currentInnings = match.currentInnings === 1 ? match.innings.first : match.innings.second;
    if (!currentInnings) {
      errors.push("No active innings found");
    }

    // Check if innings is complete
    if (currentInnings?.isComplete) {
      errors.push("Cannot score on completed innings");
    }

    // Validate batsmen are selected
    if (!currentInnings?.currentBatsmen.striker || !currentInnings?.currentBatsmen.nonStriker) {
      errors.push("Both batsmen must be selected before scoring");
    }

    // Validate bowler is selected (except for run outs)
    if (!currentInnings?.currentBowler && action.dismissalType !== 'runOut') {
      errors.push("Bowler must be selected before scoring");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  // Validate wicket action
  validateWicketAction: (dismissalType: string, outBatsman: string, match: Match): ValidationResult => {
    const errors: string[] = [];
    const currentInnings = match.currentInnings === 1 ? match.innings.first : match.innings.second;

    if (!currentInnings) {
      errors.push("No active innings found");
      return { isValid: false, errors };
    }

    // Check if innings is complete
    if (currentInnings.isComplete) {
      errors.push("Cannot take wicket on completed innings");
    }

    // Validate dismissal type
    const validDismissalTypes = ['bowled', 'caught', 'lbw', 'runOut', 'stumped', 'hitWicket', 'retiredHurt'];
    if (!validDismissalTypes.includes(dismissalType)) {
      errors.push(`Invalid dismissal type: ${dismissalType}`);
    }

    // For run out, validate batsman selection
    if (dismissalType === 'runOut' && !outBatsman) {
      errors.push("Must select which batsman is run out");
    }

    // Check if maximum wickets already fallen
    const battingTeam = match.currentInnings === 1 
      ? (match.battingFirst === match.team1?.name ? match.team1 : match.team2)
      : (match.battingFirst === match.team1?.name ? match.team2 : match.team1);
    
    const maxWickets = cricketUtils.getMaxWickets(battingTeam?.playingXI?.length || 11);
    
    if (currentInnings.wickets >= maxWickets) {
      errors.push(`All wickets have already fallen (${currentInnings.wickets}/${maxWickets})`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate match state
  validateMatchState: (match: Match): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic match validation
    if (!match.id) {
      errors.push("Match must have a valid ID");
    }

    if (!match.team1 || !match.team2) {
      errors.push("Both teams must be defined");
    }

    if (match.team1?.name === match.team2?.name) {
      errors.push("Teams must have different names");
    }

    if (match.totalOvers < CRICKET_CONSTANTS.MIN_OVERS || match.totalOvers > CRICKET_CONSTANTS.MAX_OVERS) {
      errors.push(`Invalid match overs: ${match.totalOvers}. Must be between ${CRICKET_CONSTANTS.MIN_OVERS} and ${CRICKET_CONSTANTS.MAX_OVERS}`);
    }

    // Validate team sizes
    if (match.team1?.playingXI?.length !== CRICKET_CONSTANTS.MIN_TEAM_SIZE) {
      warnings.push(`Team 1 has ${match.team1?.playingXI?.length} players, expected ${CRICKET_CONSTANTS.MIN_TEAM_SIZE}`);
    }

    if (match.team2?.playingXI?.length !== CRICKET_CONSTANTS.MIN_TEAM_SIZE) {
      warnings.push(`Team 2 has ${match.team2?.playingXI?.length} players, expected ${CRICKET_CONSTANTS.MIN_TEAM_SIZE}`);
    }

    // Validate toss information
    if (match.isLive && (!match.tossWinner || !match.tossDecision || !match.battingFirst)) {
      errors.push("Toss information must be complete before starting match");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  // Validate innings state
  validateInningsState: (innings: Innings, teamSize: number): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic innings data
    if (innings.score < 0) {
      errors.push("Innings score cannot be negative");
    }

    if (innings.wickets < 0) {
      errors.push("Wickets cannot be negative");
    }

    if (innings.overs < 0) {
      errors.push("Overs cannot be negative");
    }

    if (innings.balls < 0 || innings.balls >= CRICKET_CONSTANTS.BALLS_PER_OVER) {
      errors.push(`Invalid balls count: ${innings.balls}. Must be between 0 and ${CRICKET_CONSTANTS.BALLS_PER_OVER - 1}`);
    }

    // Check wickets don't exceed team size
    const maxWickets = cricketUtils.getMaxWickets(teamSize);
    if (innings.wickets > maxWickets) {
      errors.push(`Wickets (${innings.wickets}) cannot exceed maximum for team size (${maxWickets})`);
    }

    // Validate current players
    if (!innings.currentBatsmen.striker) {
      warnings.push("No striker selected");
    }

    if (!innings.currentBatsmen.nonStriker) {
      warnings.push("No non-striker selected");
    }

    if (innings.currentBatsmen.striker === innings.currentBatsmen.nonStriker) {
      errors.push("Striker and non-striker cannot be the same player");
    }

    if (!innings.currentBowler) {
      warnings.push("No bowler selected");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  // Validate player data
  validatePlayer: (player: Player): ValidationResult => {
    const errors: string[] = [];

    if (!player.id) {
      errors.push("Player must have a valid ID");
    }

    if (!player.name || player.name.trim().length === 0) {
      errors.push("Player must have a valid name");
    }

    if (!['batsman', 'bowler', 'allrounder', 'wicketkeeper'].includes(player.role)) {
      errors.push(`Invalid player role: ${player.role}`);
    }

    // Validate stats are not negative
    if (player.battingStats.runs < 0) {
      errors.push("Batting runs cannot be negative");
    }

    if (player.battingStats.ballsFaced < 0) {
      errors.push("Balls faced cannot be negative");
    }

    if (player.bowlingStats.runs < 0) {
      errors.push("Bowling runs cannot be negative");
    }

    if (player.bowlingStats.wickets < 0) {
      errors.push("Wickets cannot be negative");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate team data
  validateTeam: (team: Team): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!team.id) {
      errors.push("Team must have a valid ID");
    }

    if (!team.name || team.name.trim().length === 0) {
      errors.push("Team must have a valid name");
    }

    if (!team.playingXI || team.playingXI.length === 0) {
      errors.push("Team must have players in playing XI");
    }

    if (team.playingXI && team.playingXI.length !== CRICKET_CONSTANTS.MIN_TEAM_SIZE) {
      warnings.push(`Playing XI has ${team.playingXI.length} players, expected ${CRICKET_CONSTANTS.MIN_TEAM_SIZE}`);
    }

    // Validate each player
    if (team.playingXI) {
      team.playingXI.forEach((player, index) => {
        const playerValidation = validationUtils.validatePlayer(player);
        if (!playerValidation.isValid) {
          errors.push(`Player ${index + 1}: ${playerValidation.errors.join(', ')}`);
        }
      });
    }

    // Check for duplicate player IDs
    if (team.playingXI) {
      const playerIds = team.playingXI.map(p => p.id);
      const duplicates = playerIds.filter((id, index) => playerIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate player IDs found: ${duplicates.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
};

// Error formatting utilities
export const errorUtils = {
  formatValidationErrors: (validation: ValidationResult): string => {
    if (validation.isValid) return '';
    
    return validation.errors.join('\n');
  },

  formatValidationWarnings: (validation: ValidationResult): string => {
    if (!validation.warnings || validation.warnings.length === 0) return '';
    
    return validation.warnings.join('\n');
  },

  createUserFriendlyError: (error: string): string => {
    // Convert technical errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      'Cannot score on a completed match': 'This match has already finished. You cannot add more runs.',
      'Match is not currently live': 'Please start the match before scoring.',
      'Both batsmen must be selected before scoring': 'Please select both opening batsmen to begin scoring.',
      'Bowler must be selected before scoring': 'Please select a bowler to start the over.',
      'All wickets have already fallen': 'The innings is complete - all batsmen are out.',
      'Cannot take wicket on completed innings': 'This innings has already finished.',
    };

    return errorMappings[error] || error;
  }
};
