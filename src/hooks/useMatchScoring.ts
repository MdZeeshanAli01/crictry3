import { useState, useCallback, useMemo } from 'react';
import { Match, Innings, Player, ExtraType } from '@/types/cricket';
import { CRICKET_CONSTANTS, cricketUtils } from '@/constants/cricket';
import { validationUtils, ValidationResult } from '@/utils/validation';
import { cricketFeedback } from '@/utils/toast';

// Action data interface for undo functionality
interface ActionData {
  type: string;
  runs: number;
  isExtra: boolean;
  extraType?: string;
  previousState: Match;
}

// Hook return type
interface UseMatchScoringReturn {
  // State
  lastAction: ActionData | null;
  freeHit: boolean;
  
  // Actions
  updateScore: (runs: number, isExtra?: boolean, extraType?: ExtraType) => boolean;
  handleWicket: (dismissalType: string, outBatsman?: string) => boolean;
  undoLastAction: () => boolean;
  rotateStrike: () => void;
  setFreeHit: (value: boolean) => void;
  
  // Computed values
  currentInnings: Innings | null;
  battingTeam: any;
  bowlingTeam: any;
  currentRunRate: number;
  requiredRunRate: number;
  isMatchComplete: boolean;
  isInningsComplete: boolean;
  
  // Validation
  validateScoringAction: (runs: number, isExtra?: boolean, extraType?: string) => ValidationResult;
}

export const useMatchScoring = (
  matchData: Match,
  onMatchUpdate: (match: Match) => void
): UseMatchScoringReturn => {
  const [lastAction, setLastAction] = useState<ActionData | null>(null);
  const [freeHit, setFreeHit] = useState(false);

  // Computed values
  const currentInnings = useMemo(() => {
    return matchData.currentInnings === 1 ? matchData.innings.first : matchData.innings.second;
  }, [matchData.currentInnings, matchData.innings]);

  const battingTeam = useMemo(() => {
    return matchData.currentInnings === 1 
      ? (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2)
      : (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1);
  }, [matchData.currentInnings, matchData.battingFirst, matchData.team1, matchData.team2]);

  const bowlingTeam = useMemo(() => {
    return matchData.currentInnings === 1 
      ? (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1)
      : (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2);
  }, [matchData.currentInnings, matchData.battingFirst, matchData.team1, matchData.team2]);

  const currentRunRate = useMemo(() => {
    if (!currentInnings) return 0;
    return cricketUtils.calculateRunRate(
      currentInnings.score,
      currentInnings.overs,
      currentInnings.balls
    );
  }, [currentInnings?.score, currentInnings?.overs, currentInnings?.balls]);

  const requiredRunRate = useMemo(() => {
    if (!currentInnings || matchData.currentInnings === 1 || !matchData.innings.first) return 0;
    
    const target = matchData.innings.first.score + 1;
    const ballsLeft = (matchData.totalOvers * CRICKET_CONSTANTS.BALLS_PER_OVER) - 
                     (currentInnings.overs * CRICKET_CONSTANTS.BALLS_PER_OVER + currentInnings.balls);
    const oversLeft = ballsLeft / CRICKET_CONSTANTS.BALLS_PER_OVER;
    
    return cricketUtils.calculateRequiredRunRate(
      target,
      currentInnings.score,
      Math.floor(oversLeft),
      ballsLeft % CRICKET_CONSTANTS.BALLS_PER_OVER
    );
  }, [currentInnings?.score, currentInnings?.overs, currentInnings?.balls, matchData.innings.first?.score, matchData.totalOvers]);

  const isMatchComplete = useMemo(() => {
    return matchData.isComplete;
  }, [matchData.isComplete]);

  const isInningsComplete = useMemo(() => {
    if (!currentInnings || !battingTeam) return false;
    
    const maxWickets = cricketUtils.getMaxWickets(battingTeam.playingXI?.length || 11);
    const isAllOut = currentInnings.wickets >= maxWickets;
    const isOversComplete = currentInnings.overs >= matchData.totalOvers;
    const isTargetReached = matchData.currentInnings === 2 && 
                           matchData.innings.first && 
                           currentInnings.score >= (matchData.innings.first.score + 1);
    
    return isAllOut || isOversComplete || isTargetReached;
  }, [currentInnings, battingTeam, matchData.totalOvers, matchData.innings.first?.score]);

  // Validation function
  const validateScoringAction = useCallback((runs: number, isExtra = false, extraType?: string): ValidationResult => {
    return validationUtils.validateScoringAction(
      { runs, isExtra, extraType },
      matchData
    );
  }, [matchData]);

  // Update score function
  const updateScore = useCallback((runs: number, isExtra = false, extraType?: ExtraType): boolean => {
    console.log('🎯 HOOK: updateScore called with:', { runs, isExtra, extraType });
    
    // Validate the action
    const validation = validateScoringAction(runs, isExtra, extraType);
    if (!validation.isValid) {
      cricketFeedback.validation(validation);
      return false;
    }

    if (!currentInnings || !battingTeam || !bowlingTeam) {
      cricketFeedback.error('Invalid match state');
      return false;
    }

    // Store previous state for undo
    setLastAction({
      type: 'score',
      runs,
      isExtra,
      extraType,
      previousState: JSON.parse(JSON.stringify(matchData))
    });

    const updatedMatch = { ...matchData };
    const innings = updatedMatch.currentInnings === 1 ? updatedMatch.innings.first : updatedMatch.innings.second;
    
    if (!innings) return false;

    // Update score
    innings.score += runs;
    
    // Handle ball counting and strike rotation
    let ballCounted = false;
    let shouldRotateStrike = false;

    if (!isExtra) {
      ballCounted = true;
      shouldRotateStrike = runs % 2 === 1;
      
      // Update batsman stats
      const striker = innings.currentBatsmen.striker;
      if (striker && battingTeam) {
        const strikerPlayer = battingTeam.playingXI.find((p: Player) => p.id === striker);
        if (strikerPlayer) {
          strikerPlayer.battingStats.runs += runs;
          strikerPlayer.battingStats.ballsFaced += 1;
          if (runs === CRICKET_CONSTANTS.BOUNDARY_FOUR) strikerPlayer.battingStats.fours += 1;
          if (runs === CRICKET_CONSTANTS.BOUNDARY_SIX) strikerPlayer.battingStats.sixes += 1;
          strikerPlayer.battingStats.strikeRate = cricketUtils.calculateStrikeRate(
            strikerPlayer.battingStats.runs,
            strikerPlayer.battingStats.ballsFaced
          );
        }
      }
    } else {
      // Handle extras
      innings.extras += runs;
      
      if (extraType === 'noball') {
        setFreeHit(true);
        ballCounted = false;
      } else if (extraType === 'wide') {
        ballCounted = false;
      } else if (extraType === 'bye' || extraType === 'legbye') {
        ballCounted = true;
        shouldRotateStrike = runs % 2 === 1;
      }
    }

    // Update bowler stats
    if (bowlingTeam && innings.currentBowler) {
      const bowler = bowlingTeam.playingXI.find((p: Player) => p.id === innings.currentBowler);
      if (bowler) {
        bowler.bowlingStats.runs += runs;
        
        if (ballCounted && !freeHit) {
          bowler.bowlingStats.balls += 1;
          
          // Update overs when 6 balls are completed
          if (bowler.bowlingStats.balls >= CRICKET_CONSTANTS.BALLS_PER_OVER) {
            bowler.bowlingStats.overs += Math.floor(bowler.bowlingStats.balls / CRICKET_CONSTANTS.BALLS_PER_OVER);
            bowler.bowlingStats.balls = bowler.bowlingStats.balls % CRICKET_CONSTANTS.BALLS_PER_OVER;
          }
        }
        
        // Update economy rate
        bowler.bowlingStats.economyRate = cricketUtils.calculateEconomyRate(
          bowler.bowlingStats.runs,
          bowler.bowlingStats.overs,
          bowler.bowlingStats.balls
        );

        // Track extras
        if (isExtra) {
          if (extraType === 'wide') bowler.bowlingStats.wides += 1;
          if (extraType === 'noball') bowler.bowlingStats.noBalls += 1;
        }
      }
    }

    // Update ball count for innings
    if (ballCounted && !freeHit) {
      innings.balls += 1;
      
      if (innings.balls === CRICKET_CONSTANTS.BALLS_PER_OVER) {
        innings.overs += 1;
        innings.balls = 0;
        shouldRotateStrike = true; // Rotate strike at end of over
      }
    }

    // Rotate strike if needed - IMMUTABLE UPDATE
    if (shouldRotateStrike) {
      console.log('🔄 HOOK: Strike rotation triggered');
      const temp = innings.currentBatsmen.striker;
      innings.currentBatsmen = {
        ...innings.currentBatsmen,
        striker: innings.currentBatsmen.nonStriker,
        nonStriker: temp
      };
      console.log('🔄 HOOK: Strike rotated from', temp, 'to', innings.currentBatsmen.striker);
    }

    // Clear free hit if ball was counted
    if (ballCounted && freeHit) {
      setFreeHit(false);
    }

    // Check for innings/match completion
    const maxWickets = cricketUtils.getMaxWickets(battingTeam.playingXI?.length || 11);
    const isInningsComplete = innings.wickets >= maxWickets || innings.overs >= matchData.totalOvers;
    const isTargetReached = matchData.currentInnings === 2 && 
                           matchData.innings.first && 
                           innings.score >= (matchData.innings.first.score + 1);

    if (isInningsComplete || isTargetReached) {
      innings.isComplete = true;
      
      if (matchData.currentInnings === 1) {
        // Start second innings
        updatedMatch.currentInnings = 2;
      } else {
        // Match complete
        updatedMatch.isComplete = true;
        updatedMatch.isLive = false;
        
        // Calculate result
        const result = cricketUtils.calculateMatchResult(updatedMatch);
        updatedMatch.winner = result.winner;
        updatedMatch.result = result.result;
      }
    }

    console.log('🎯 HOOK: Calling onMatchUpdate with updated match');
    onMatchUpdate(updatedMatch);
    cricketFeedback.scoreUpdate(runs, isExtra);
    
    return true;
  }, [matchData, currentInnings, battingTeam, bowlingTeam, freeHit, onMatchUpdate, validateScoringAction]);

  // Handle wicket function
  const handleWicket = useCallback((dismissalType: string, outBatsman?: string): boolean => {
    const validation = validationUtils.validateWicketAction(dismissalType, outBatsman || '', matchData);
    if (!validation.isValid) {
      cricketFeedback.validation(validation);
      return false;
    }

    if (!currentInnings || !battingTeam) {
      cricketFeedback.error('Invalid match state for wicket');
      return false;
    }

    // Store previous state for undo
    setLastAction({
      type: 'wicket',
      runs: 0,
      isExtra: false,
      previousState: JSON.parse(JSON.stringify(matchData))
    });

    const updatedMatch = { ...matchData };
    const innings = updatedMatch.currentInnings === 1 ? updatedMatch.innings.first : updatedMatch.innings.second;
    
    if (!innings) return false;

    // Determine which batsman is out
    const batsmanToUpdate = dismissalType === 'runOut' ? outBatsman : innings.currentBatsmen.striker;
    
    // Update player stats
    let dismissedBatsman: Player | undefined;
    const updatedPlayingXI = battingTeam.playingXI.map((player: Player) => {
      if (player.id === batsmanToUpdate) {
        const updatedBatsman = JSON.parse(JSON.stringify(player));
        dismissedBatsman = updatedBatsman;
        updatedBatsman.battingStats.isOut = true;
        updatedBatsman.battingStats.dismissalType = dismissalType as any;
        
        // Add ball faced if not run out or if striker was run out
        if (dismissalType !== 'runOut' || batsmanToUpdate === innings.currentBatsmen.striker) {
          updatedBatsman.battingStats.ballsFaced += 1;
        }
        
        return updatedBatsman;
      }
      return player;
    });
    
    battingTeam.playingXI = updatedPlayingXI;

    // Update bowler stats (except for run outs)
    if (dismissalType !== 'runOut' && bowlingTeam && innings.currentBowler) {
      const bowler = bowlingTeam.playingXI.find((p: Player) => p.id === innings.currentBowler);
      if (bowler) {
        bowler.bowlingStats.wickets += 1;
        
        if (!freeHit) {
          bowler.bowlingStats.balls += 1;
          
          if (bowler.bowlingStats.balls >= CRICKET_CONSTANTS.BALLS_PER_OVER) {
            bowler.bowlingStats.overs += Math.floor(bowler.bowlingStats.balls / CRICKET_CONSTANTS.BALLS_PER_OVER);
            bowler.bowlingStats.balls = bowler.bowlingStats.balls % CRICKET_CONSTANTS.BALLS_PER_OVER;
          }
          
          bowler.bowlingStats.economyRate = cricketUtils.calculateEconomyRate(
            bowler.bowlingStats.runs,
            bowler.bowlingStats.overs,
            bowler.bowlingStats.balls
          );
        }
      }
    }

    // Update innings wickets
    innings.wickets += 1;

    // Handle ball count for wickets (except run outs on free hits)
    if (dismissalType !== 'runOut' && !freeHit) {
      innings.balls += 1;
      
      if (innings.balls === CRICKET_CONSTANTS.BALLS_PER_OVER) {
        innings.overs += 1;
        innings.balls = 0;
        
        // Rotate strike at end of over - IMMUTABLE UPDATE
        const temp = innings.currentBatsmen.striker;
        innings.currentBatsmen = {
          ...innings.currentBatsmen,
          striker: innings.currentBatsmen.nonStriker,
          nonStriker: temp
        };
      }
    }

    // Clear free hit
    if (freeHit) setFreeHit(false);

    // Check for innings completion
    const maxWickets = cricketUtils.getMaxWickets(battingTeam.playingXI?.length || 11);
    if (innings.wickets >= maxWickets || innings.overs >= matchData.totalOvers) {
      innings.isComplete = true;
      
      if (matchData.currentInnings === 1) {
        updatedMatch.currentInnings = 2;
      } else {
        updatedMatch.isComplete = true;
        updatedMatch.isLive = false;
      }
    }

    onMatchUpdate(updatedMatch);
    cricketFeedback.wicket(dismissalType, dismissedBatsman?.name);
    
    return true;
  }, [matchData, currentInnings, battingTeam, bowlingTeam, freeHit, onMatchUpdate]);

  // Undo last action
  const undoLastAction = useCallback((): boolean => {
    if (!lastAction) {
      cricketFeedback.error('No action to undo');
      return false;
    }

    onMatchUpdate(lastAction.previousState);
    setLastAction(null);
    cricketFeedback.scoreUpdate(0); // Generic undo feedback
    
    return true;
  }, [lastAction, onMatchUpdate]);

  // Rotate strike manually
  const rotateStrike = useCallback(() => {
    if (!currentInnings) return;
    
    const updatedMatch = { ...matchData };
    const innings = updatedMatch.currentInnings === 1 ? updatedMatch.innings.first : updatedMatch.innings.second;
    
    if (innings) {
      console.log('🔄 HOOK: Manual strike rotation');
      const temp = innings.currentBatsmen.striker;
      innings.currentBatsmen = {
        ...innings.currentBatsmen,
        striker: innings.currentBatsmen.nonStriker,
        nonStriker: temp
      };
      console.log('🔄 HOOK: Manual strike rotated from', temp, 'to', innings.currentBatsmen.striker);
      
      onMatchUpdate(updatedMatch);
    }
  }, [matchData, currentInnings, onMatchUpdate]);

  return {
    // State
    lastAction,
    freeHit,
    
    // Actions
    updateScore,
    handleWicket,
    undoLastAction,
    rotateStrike,
    setFreeHit,
    
    // Computed values
    currentInnings: currentInnings || null,
    battingTeam,
    bowlingTeam,
    currentRunRate,
    requiredRunRate,
    isMatchComplete,
    isInningsComplete: isInningsComplete || false,
    validateScoringAction
  };
};