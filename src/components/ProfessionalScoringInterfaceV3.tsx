import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import GlassCard from './GlassCard';
import { Match, Innings, ExtraType, Player } from '../types/cricket';
import { RotateCcw, Trophy, Users } from 'lucide-react';

interface ProfessionalScoringInterfaceProps {
  matchData: Match;
  setMatchData: (match: Match) => void;
  onScoreUpdate: (match: Match) => void;
  onNavigateHome?: () => void;
}

type DismissalType = 'bowled' | 'lbw' | 'caught' | 'hitWicket' | 'runOut' | 'stumped';

interface ActionData {
  type: string;
  runs: number;
  isExtra: boolean;
  extraType?: string;
  previousState: Match;
}

const ProfessionalScoringInterfaceV3: React.FC<ProfessionalScoringInterfaceProps> = ({
  matchData,
  setMatchData,
  onScoreUpdate,
  onNavigateHome
}) => {
  // State management
  const [lastAction, setLastAction] = useState<ActionData | null>(null);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
  const [selectedDismissalType, setSelectedDismissalType] = useState<DismissalType>('bowled');
  const [outBatsman, setOutBatsman] = useState<string>('');

  
  // Bowler selection state
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [selectedNewBowler, setSelectedNewBowler] = useState<string>('');
  
  // Additional professional features state
  const [showStrikerModal, setShowStrikerModal] = useState(false);
  const [showRetiredHurtModal, setShowRetiredHurtModal] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [showMatchCompletionScorecard, setShowMatchCompletionScorecard] = useState(false);
  
  // Second innings player selection state
  const [secondInningsOpeners, setSecondInningsOpeners] = useState({ striker: '', nonStriker: '' });
  
  // Mobile extras modal states
  const [showWideModal, setShowWideModal] = useState(false);
  const [showNoBallModal, setShowNoBallModal] = useState(false);
  const [showByeModal, setShowByeModal] = useState(false);
  const [showLegByeModal, setShowLegByeModal] = useState(false);
  const [showNoBallByeModal, setShowNoBallByeModal] = useState(false);
  const [showNoBallLegByeModal, setShowNoBallLegByeModal] = useState(false);
  const [secondInningsOpeningBowler, setSecondInningsOpeningBowler] = useState('');
  
  // End match state
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);

  // Animation states
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [boundaryAnimation, setBoundaryAnimation] = useState(false);

  // Game mechanics states
  const [freeHit, setFreeHit] = useState(false);

  // Helper function to calculate match winner correctly based on toss and innings
  const calculateMatchWinner = (match: Match) => {
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
  };

  // Helper function to calculate match awards based on official cricket criteria
  const calculateMatchAwards = (match: Match) => {
    const allPlayers = [...match.team1.playingXI, ...match.team2.playingXI];
    
    // Best Batsman: Highest runs scored
    const bestBatsman = allPlayers
      .filter(p => p.battingStats.runs > 0)
      .sort((a, b) => {
        // Primary: Most runs
        if (b.battingStats.runs !== a.battingStats.runs) {
          return b.battingStats.runs - a.battingStats.runs;
        }
        // Secondary: Better strike rate
        return b.battingStats.strikeRate - a.battingStats.strikeRate;
      })[0];

    // Best Bowler: Most wickets, then best economy rate
    const bestBowler = allPlayers
      .filter(p => p.bowlingStats.wickets > 0 || p.bowlingStats.overs > 0)
      .sort((a, b) => {
        // Primary: Most wickets
        if (b.bowlingStats.wickets !== a.bowlingStats.wickets) {
          return b.bowlingStats.wickets - a.bowlingStats.wickets;
        }
        // Secondary: Better economy rate (lower is better)
        const aEconomy = a.bowlingStats.overs > 0 ? a.bowlingStats.runs / a.bowlingStats.overs : 999;
        const bEconomy = b.bowlingStats.overs > 0 ? b.bowlingStats.runs / b.bowlingStats.overs : 999;
        return aEconomy - bEconomy;
      })[0];

    // Man of the Match: Most impactful performance (runs + wickets * 20 + catches * 10)
    const manOfTheMatch = allPlayers
      .map(p => ({
        player: p,
        impact: p.battingStats.runs + (p.bowlingStats.wickets * 20) + (p.fieldingStats.catches * 10) + (p.fieldingStats.runOuts * 15)
      }))
      .sort((a, b) => b.impact - a.impact)[0]?.player;

    return {
      bestBatsman,
      bestBowler,
      manOfTheMatch
    };
  };

  // Helper functions for match analysis
  const isPowerPlayActive = (innings: Innings): boolean => {
    if (!innings.powerPlayOvers) return false;
    const currentOver = innings.overs;
    return innings.powerPlayOvers.includes(currentOver);
  };

  // const getMatchPhase = (innings: Innings): 'powerplay' | 'middle' | 'death' => {
  //   const totalOvers = matchData.totalOvers;
  //   const currentOver = innings.overs;
  //   
  //   if (isPowerPlayActive(innings)) return 'powerplay';
  //   if (currentOver >= totalOvers - 5) return 'death';
  //   return 'middle';
  // };

  // const generateBallCommentary = (runs: number, isExtra: boolean, extraType?: ExtraType): string => {
  //   const striker = getBattingTeamPlayers().find(p => p.id === currentInnings?.currentBatsmen.striker);
  //   const bowler = getBowlingTeamPlayers().find(p => p.id === currentInnings?.currentBowler);
  //   
  //   if (!striker || !bowler) return '';

  //   const overNumber = Math.floor((currentInnings?.overs || 0)) + 1;
  //   const ballNumber = (currentInnings?.balls || 0) + 1;
  //   let commentary = `${overNumber}.${ballNumber} ${bowler.name} to ${striker.name}, `;
  //   
  //   // Enhanced commentary with more context
  //   if (isExtra) {
  //     switch (extraType) {
  //       case 'wide': 
  //         commentary += `WIDE! ${runs > 1 ? `${runs - 1} runs added. ` : 'Down the leg side. '}`;
  //         if (runs > 3) commentary += 'Keeper couldn\'t collect it cleanly!';
  //         break;
  //       case 'noball': 
  //         commentary += `NO BALL! ${runs > 1 ? `${runs - 1} runs off the free hit. ` : 'Free hit coming up! '}`;
  //         if (runs === 6) commentary += 'What a way to punish the free hit!';
  //         break;
  //       case 'bye': 
  //         commentary += `${runs} BYE${runs > 1 ? 'S' : ''}! `;
  //         commentary += runs > 2 ? 'Keeper missed it completely!' : 'Sneaks past the keeper.';
  //         break;
  //       case 'legbye': 
  //         commentary += `${runs} LEG BYE${runs > 1 ? 'S' : ''}! `;
  //         commentary += 'Off the pads, quick running between the wickets.';
  //         break;
  //     }
  //   } else {
  //     switch (runs) {
  //       case 0: 
  //         commentary += Math.random() > 0.5 ? 'dot ball, well bowled!' : 'defended solidly.';
  //         break;
  //       case 1: 
  //         commentary += Math.random() > 0.5 ? 'takes a quick single.' : 'nudged for one.';
  //         break;
  //       case 2: 
  //         commentary += Math.random() > 0.5 ? 'good running, two runs!' : 'placed in the gap for two.';
  //         break;
  //       case 3: 
  //         commentary += 'excellent running, three runs! Great placement.';
  //         break;
  //       case 4: 
  //         const fourComments = [
  //           'FOUR! Cracking shot through the covers!',
  //           'FOUR! Timed to perfection!',
  //           'FOUR! Finds the gap beautifully!',
  //           'FOUR! What a stroke!'
  //         ];
  //         commentary += fourComments[Math.floor(Math.random() * fourComments.length)];
  //         break;
  //       case 6: 
  //         const sixComments = [
  //           'SIX! That\'s absolutely massive!',
  //           'SIX! Into the stands!',
  //           'SIX! Clean as a whistle!',
  //           'SIX! What a shot! The crowd is on its feet!'
  //         ];
  //         commentary += sixComments[Math.floor(Math.random() * sixComments.length)];
  //         break;
  //       default: 
  //         commentary += `${runs} runs, good cricket!`;
  //         break;
  //     }
  //   }
  //   
  //   // Add match situation context for second innings
  //   if (matchData.currentInnings === 2 && matchData.innings.first) {
  //     const target = matchData.innings.first.score + 1;
  //     const required = target - (currentInnings?.score || 0);
  //     const ballsLeft = (matchData.totalOvers * 6) - ((currentInnings?.overs || 0) * 6 + (currentInnings?.balls || 0));
  //     
  //     if (required <= 10) {
  //       commentary += ` ${required} needed from ${ballsLeft} balls.`;
  //     }
  //   }
  //   
  //   return commentary;
  // };
  // Derived state
  const currentInnings = matchData.currentInnings === 1 ? matchData.innings.first : matchData.innings.second;
  
  // Debug logging
  console.log('Current innings state:', {
    currentInningsNumber: matchData.currentInnings,
    firstInnings: !!matchData.innings.first,
    secondInnings: !!matchData.innings.second,
    currentInnings: !!currentInnings,
    showInningsBreak: showInningsBreak
  });
  const isFirstInnings = matchData.currentInnings === 1;
  const currentScore = currentInnings?.score || 0;
  const currentWickets = currentInnings?.wickets || 0;
  const currentOvers = `${currentInnings?.overs || 0}.${currentInnings?.balls || 0}`;
  const runRate = currentInnings && currentInnings.overs > 0 ? 
    (currentScore / (currentInnings.overs + currentInnings.balls / 6)).toFixed(2) : '0.00';

  // Auto-initialize match if players are not set
  useEffect(() => {
    console.log('Auto-initialization check:', {
      hasCurrentInnings: !!currentInnings,
      striker: currentInnings?.currentBatsmen?.striker,
      nonStriker: currentInnings?.currentBatsmen?.nonStriker,
      bowler: currentInnings?.currentBowler,
      team1PlayingXI: matchData.team1?.playingXI?.length,
      team2PlayingXI: matchData.team2?.playingXI?.length
    });

    if (currentInnings && (!currentInnings.currentBatsmen.striker || !currentInnings.currentBatsmen.nonStriker || !currentInnings.currentBowler)) {
      console.log('Auto-initializing match with default players');
      
      // CRITICAL FIX: Use battingFirst to determine correct teams for auto-initialization
      const battingTeam = matchData.currentInnings === 1 ? 
        (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2) :
        (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1);
      const bowlingTeam = matchData.currentInnings === 1 ? 
        (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1) :
        (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2);
      
      console.log('Teams for initialization:', {
        battingTeam: battingTeam?.name,
        bowlingTeam: bowlingTeam?.name,
        battingPlayingXI: battingTeam?.playingXI?.length,
        bowlingPlayingXI: bowlingTeam?.playingXI?.length
      });
      
      if (battingTeam?.playingXI && battingTeam.playingXI.length >= 2 && bowlingTeam?.playingXI && bowlingTeam.playingXI.length >= 1) {
        const updatedMatch = { ...matchData };
        const innings = updatedMatch.currentInnings === 1 ? updatedMatch.innings.first : updatedMatch.innings.second;
        
        if (innings) {
          // Set default opening batsmen (first two players)
          innings.currentBatsmen = {
            striker: battingTeam.playingXI[0].id,
            nonStriker: battingTeam.playingXI[1].id
          };
          
          // Set default bowler (first bowler or all-rounder)
          const defaultBowler = bowlingTeam.playingXI.find(p => p.role === 'bowler' || p.role === 'allrounder') || bowlingTeam.playingXI[0];
          innings.currentBowler = defaultBowler.id;
          
          console.log('Auto-initialized with:', {
            striker: battingTeam.playingXI[0].name,
            nonStriker: battingTeam.playingXI[1].name,
            bowler: defaultBowler.name
          });
          
          onScoreUpdate(updatedMatch);
        }
      } else {
        console.log('Cannot auto-initialize: insufficient players', {
          battingTeamPlayers: battingTeam?.playingXI?.length,
          bowlingTeamPlayers: bowlingTeam?.playingXI?.length
        });
      }
    }
  }, [currentInnings, matchData, onScoreUpdate]);
  
  const target = !isFirstInnings ? (matchData.innings.first?.score || 0) + 1 : null;
  const requiredRunRate = !isFirstInnings && target ? 
    ((target - currentScore) / ((matchData.totalOvers - (currentInnings?.overs || 0)) - (currentInnings?.balls || 0) / 6)).toFixed(2) : '0.00';

  // Helper functions
  const rotateStrike = (innings: Innings) => {
    return {
      striker: innings.currentBatsmen.nonStriker,
      nonStriker: innings.currentBatsmen.striker
    };
  };

  const getBattingTeamPlayers = () => {
    // CRITICAL FIX: Use battingFirst to determine correct batting team, not hardcoded team1/team2
    const battingTeam = matchData.currentInnings === 1 ? 
      (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2) :
      (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1);
    
    console.log('getBattingTeamPlayers FIXED Debug:', {
      currentInnings: matchData.currentInnings,
      battingFirst: matchData.battingFirst,
      team1Name: matchData.team1?.name,
      team2Name: matchData.team2?.name,
      battingTeamName: battingTeam?.name,
      battingTeamPlayers: battingTeam?.playingXI?.map(p => p.name)
    });
    return battingTeam?.playingXI || [];
  };

  const getBowlingTeamPlayers = () => {
    // CRITICAL FIX: Use battingFirst to determine correct bowling team, not hardcoded team1/team2
    const bowlingTeam = matchData.currentInnings === 1 ? 
      (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1) :
      (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2);
    
    console.log('getBowlingTeamPlayers FIXED Debug:', {
      currentInnings: matchData.currentInnings,
      battingFirst: matchData.battingFirst,
      team1Name: matchData.team1?.name,
      team2Name: matchData.team2?.name,
      bowlingTeamName: bowlingTeam?.name,
      bowlingTeamPlayers: bowlingTeam?.playingXI?.map(p => p.name)
    });
    return bowlingTeam?.playingXI || [];
  };

  const getAvailableBowlers = () => {
    // CRITICAL FIX: Use battingFirst to determine correct bowling team, same as getBowlingTeamPlayers
    const bowlingTeam = matchData.currentInnings === 1 ? 
      (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1) :
      (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2);
    
    const currentBowler = currentInnings?.currentBowler;
    const isFirstOver = currentInnings?.balls === 0 && currentInnings?.overs === 0;
    
    console.log('getAvailableBowlers FIXED Debug:', {
      currentInnings: matchData.currentInnings,
      battingFirst: matchData.battingFirst,
      team1Name: matchData.team1?.name,
      team2Name: matchData.team2?.name,
      bowlingTeamName: bowlingTeam?.name,
      bowlingTeamPlayers: bowlingTeam?.playingXI?.map(p => p.name),
      currentBowler,
      isFirstOver
    });
    
    return (bowlingTeam.playingXI || []).filter(player => {
      if (isFirstOver || !currentBowler) {
        return true;
      }
      return player.id !== currentBowler;
    });
  };

  // Centralized helper to get current batsmen and handle inconsistencies
  const getCurrentBatsmen = () => {
    const battingPlayers = getBattingTeamPlayers();
    if (!currentInnings || !battingPlayers.length) {
      return [];
    }

    const { striker, nonStriker } = currentInnings.currentBatsmen;
    let currentBatsmen: { player: any; isStriker: boolean }[] = [];

    // --- Logic from scorecard display ---
    // First, try to use the official striker/non-striker
    if (striker) {
      const strikerPlayer = battingPlayers.find(p => p.id === striker);
      if (strikerPlayer) {
        // If they're current batsmen but marked as out, fix the data inconsistency
        if (strikerPlayer.battingStats.isOut && !strikerPlayer.battingStats.isRetiredHurt) {
          console.log('🔧 FIXING DATA INCONSISTENCY (from getCurrentBatsmen): Striker marked as out');
          strikerPlayer.battingStats.isOut = false;
        }
        currentBatsmen.push({ player: strikerPlayer, isStriker: true });
      }
    }
    
    if (nonStriker) {
      const nonStrikerPlayer = battingPlayers.find(p => p.id === nonStriker);
      if (nonStrikerPlayer) {
        // If they're current batsmen but marked as out, fix the data inconsistency
        if (nonStrikerPlayer.battingStats.isOut && !nonStrikerPlayer.battingStats.isRetiredHurt) {
          console.log('🔧 FIXING DATA INCONSISTENCY (from getCurrentBatsmen): Non-striker marked as out');
          nonStrikerPlayer.battingStats.isOut = false;
        }
        currentBatsmen.push({ player: nonStrikerPlayer, isStriker: false });
      }
    }

    // FALLBACK: If we don't have 2 current batsmen, find the most recent active batsmen
    if (currentBatsmen.length < 2 && battingPlayers.length > 1) {
      console.warn('FALLBACK (from getCurrentBatsmen): Not enough current batsmen found, using fallback logic');
      const availableBatsmen = battingPlayers
        .filter(p => !p.battingStats.isOut || p.battingStats.isRetiredHurt)
        .sort((a, b) => (b.battingStats.ballsFaced || 0) - (a.battingStats.ballsFaced || 0)); // Most recently active first
      
      // Clear current batsmen and rebuild
      currentBatsmen = [];
      
      // Add striker (or most active batsman)
      if (striker && availableBatsmen.find(p => p.id === striker)) {
        currentBatsmen.push({ player: availableBatsmen.find(p => p.id === striker)!, isStriker: true });
      } else if (availableBatsmen.length > 0) {
        currentBatsmen.push({ player: availableBatsmen[0], isStriker: true });
      }
      
      // Add non-striker (or second most active batsman)
      if (nonStriker && availableBatsmen.find(p => p.id === nonStriker && p.id !== currentBatsmen[0]?.player.id)) {
        currentBatsmen.push({ player: availableBatsmen.find(p => p.id === nonStriker)!, isStriker: false });
      } else if (availableBatsmen.length > 1) {
        const secondBatsman = availableBatsmen.find(p => p.id !== currentBatsmen[0]?.player.id);
        if (secondBatsman) {
          currentBatsmen.push({ player: secondBatsman, isStriker: false });
        }
      }
    }
    
    return currentBatsmen;
  };

  // Scoring logic - Completely rewritten with correct cricket rules
  const updateScore = (runs: number, isExtra = false, extraType?: ExtraType) => {
    if (!matchData || !currentInnings) return;
    
    // Save current state for undo functionality
    setLastAction({
      type: 'score',
      runs,
      isExtra,
      extraType,
      previousState: JSON.parse(JSON.stringify(matchData))
    });
    
    const updatedMatch = { ...matchData };
    const innings = updatedMatch.currentInnings === 1 ? updatedMatch.innings.first : updatedMatch.innings.second;
    
    if (!innings) {
      console.error('Invalid innings state');
      return;
    }
    
    // Get batting and bowling teams
    const battingTeam = updatedMatch.currentInnings === 1 ? 
      (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team1 : updatedMatch.team2) :
      (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team2 : updatedMatch.team1);
    
    const bowlingTeam = updatedMatch.currentInnings === 1 ? 
      (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team2 : updatedMatch.team1) :
      (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team1 : updatedMatch.team2);
    
    // Always update total score
    innings.score += runs;
    
    // Variables for ball counting and strike rotation
    let ballCounted = false;
    let shouldRotateStrike = false;
    
    // Handle different types of deliveries
    if (!isExtra) {
      // Normal runs (0, 1, 2, 3, 4, 6)
      ballCounted = true;
      shouldRotateStrike = runs % 2 === 1; // Rotate on odd runs
      
      // Update batsman stats
      const striker = innings.currentBatsmen.striker;
      if (striker && battingTeam) {
        const strikerPlayer = battingTeam.playingXI.find(p => p.id === striker);
        if (strikerPlayer) {
          strikerPlayer.battingStats.runs += runs;
          strikerPlayer.battingStats.ballsFaced += 1;
          if (runs === 4) strikerPlayer.battingStats.fours += 1;
          if (runs === 6) strikerPlayer.battingStats.sixes += 1;
          // Update strike rate
          strikerPlayer.battingStats.strikeRate = strikerPlayer.battingStats.ballsFaced > 0 ? 
            (strikerPlayer.battingStats.runs / strikerPlayer.battingStats.ballsFaced) * 100 : 0;
        }
      }
      
      // Clear Free Hit after normal delivery
      if (freeHit) {
        setFreeHit(false);
        console.log('🎯 Free Hit completed');
      }
      
    } else {
      // Handle extras
      switch (extraType) {
        case 'wide':
          // Wide: No ball counted, no strike rotation
          ballCounted = false;
          shouldRotateStrike = false;
          break;
          
        case 'noball':
          // No Ball: No ball counted, set free hit, rotate on odd runs by batsman
          ballCounted = false;
          setFreeHit(true);
          const noBallBatsmanRuns = runs - 1; // Subtract the penalty run
          shouldRotateStrike = noBallBatsmanRuns % 2 === 1;
          
          // Update batsman stats for no-ball runs
          if (noBallBatsmanRuns > 0) {
            const striker = innings.currentBatsmen.striker;
            if (striker && battingTeam) {
              const strikerPlayer = battingTeam.playingXI.find(p => p.id === striker);
              if (strikerPlayer) {
                strikerPlayer.battingStats.runs += noBallBatsmanRuns;
                strikerPlayer.battingStats.ballsFaced += 1;
                if (noBallBatsmanRuns === 4) strikerPlayer.battingStats.fours += 1;
                if (noBallBatsmanRuns === 6) strikerPlayer.battingStats.sixes += 1;
                strikerPlayer.battingStats.strikeRate = strikerPlayer.battingStats.ballsFaced > 0 ? 
                  (strikerPlayer.battingStats.runs / strikerPlayer.battingStats.ballsFaced) * 100 : 0;
              }
            }
          }
          break;
          
        case 'bye':
        case 'legbye':
          // Byes/Leg Byes: Ball counted, rotate on odd runs
          ballCounted = true;
          shouldRotateStrike = runs % 2 === 1;
          break;
          
        default:
          // Default case for other extras
          ballCounted = false;
          shouldRotateStrike = false;
      }
    }
    
    // Update ball count if needed
    if (ballCounted) {
      innings.balls += 1;
    }
    
    // Handle strike rotation
    if (shouldRotateStrike) {
      const temp = innings.currentBatsmen.striker;
      innings.currentBatsmen.striker = innings.currentBatsmen.nonStriker;
      innings.currentBatsmen.nonStriker = temp;
    }
    
    // Handle over completion
    if (innings.balls >= 6) {
      innings.overs += 1;
      innings.balls = 0;
      
      // Strike changes at end of over (regardless of previous rotation)
      const temp = innings.currentBatsmen.striker;
      innings.currentBatsmen.striker = innings.currentBatsmen.nonStriker;
      innings.currentBatsmen.nonStriker = temp;
      
      // Show bowler selection if innings continues
      const maxWickets = 10;
      if (innings.overs < updatedMatch.totalOvers && innings.wickets < maxWickets) {
        setTimeout(() => setShowBowlerModal(true), 500);
      }
    }
    
    // Update bowler stats
    if (innings.currentBowler && bowlingTeam) {
      const bowlerPlayer = bowlingTeam.playingXI.find(p => p.id === innings.currentBowler);
      if (bowlerPlayer) {
        // Always add runs to bowler (except for byes/leg-byes)
        if (!isExtra || (extraType !== 'bye' && extraType !== 'legbye')) {
          bowlerPlayer.bowlingStats.runs += runs;
        }
        
        // Add ball to bowler's count only if ball was counted in the over
        if (ballCounted) {
          bowlerPlayer.bowlingStats.balls += 1;
          // Update overs when 6 balls are completed
          if (bowlerPlayer.bowlingStats.balls >= 6) {
            bowlerPlayer.bowlingStats.overs += Math.floor(bowlerPlayer.bowlingStats.balls / 6);
            bowlerPlayer.bowlingStats.balls = bowlerPlayer.bowlingStats.balls % 6;
          }
        }
        
        // Calculate economy rate
        const totalOvers = bowlerPlayer.bowlingStats.overs + (bowlerPlayer.bowlingStats.balls / 6);
        bowlerPlayer.bowlingStats.economyRate = totalOvers > 0 ? 
          bowlerPlayer.bowlingStats.runs / totalOvers : 0;
      }
    }
    
    // Trigger animations
    if (runs === 4 || runs === 6) {
      setBoundaryAnimation(true);
      setTimeout(() => setBoundaryAnimation(false), 2000);
    }
    
    // Check for innings completion and target chase logic
    const maxWickets = 10; // Standard cricket limit
    const isInningsComplete = innings.overs >= updatedMatch.totalOvers || innings.wickets >= maxWickets;
    
    if (updatedMatch.currentInnings === 1) {
      // First innings logic
      if (isInningsComplete) {
        // First innings completed - calculate target for second innings
        const firstInningsScore = updatedMatch.innings.first?.score || 0;
        console.log(`🏏 First innings completed! Target: ${firstInningsScore + 1}`);
      }
    } else {
      // Second innings logic - check for target reached or innings completed
      const target = (updatedMatch.innings.first?.score || 0) + 1;
      const targetReached = innings.score >= target;
      
      if (targetReached) {
        // Second team wins by reaching target
        updatedMatch.isComplete = true;
        const winnerResult = calculateMatchWinner(updatedMatch);
        updatedMatch.winner = winnerResult.winner;
        updatedMatch.result = winnerResult.result;
        console.log(`🏆 ${winnerResult.winner} wins! Target reached!`);
      } else if (isInningsComplete) {
        // Second team fails to reach target
        updatedMatch.isComplete = true;
        const winnerResult = calculateMatchWinner(updatedMatch);
        updatedMatch.winner = winnerResult.winner;
        updatedMatch.result = winnerResult.result;
        console.log(`🏆 ${winnerResult.winner} wins! Target not reached!`);
      }
    }
    
    // Update match data
    setMatchData(updatedMatch);
    onScoreUpdate(updatedMatch);
    
    // Trigger score animation
    setScoreAnimation(true);
    setTimeout(() => setScoreAnimation(false), 1000);
  };



  // Wicket handling
  const handleWicket = (dismissalType: DismissalType) => {
    // Validate match state
    if (!matchData || !currentInnings) {
      console.error('Invalid match state');
      return;
    }
    if (matchData.isComplete) {
      console.error('Cannot take wicket: Match is complete');
      return;
    }

    const updatedMatch = { ...matchData };
    const innings = updatedMatch.currentInnings === 1 ? updatedMatch.innings.first : updatedMatch.innings.second;
    
    if (!innings) {
      console.error('Invalid innings state');
      return;
    }

    // Validate innings state
    if (innings.isComplete) {
      console.error('Cannot take wicket: Innings is complete');
      return;
    }
    // Define dismissal types that don't require a bowler
    const nonBowlerDismissals = ['runOut', 'retiredHurt', 'obstructingField', 'handledBall', 'timedOut'] as Array<DismissalType>;

    // CRITICAL FIX: Use dynamic wicket limit based on team size (team size - 1)
    const battingTeamForValidation = matchData.currentInnings === 1 ? 
      (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2) :
      (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1);
    const maxWicketsForWicket = (battingTeamForValidation?.playingXI?.length || 11) - 1;
    
    if (innings.wickets >= (maxWicketsForWicket - 1) && dismissalType === ('retiredHurt' as DismissalType)) {
      console.error(`Cannot retire hurt: Last wicket (${innings.wickets}/${maxWicketsForWicket})`);
      return;
    }
    if (innings.wickets >= maxWicketsForWicket) {
      console.error(`All wickets already fallen (${innings.wickets}/${maxWicketsForWicket})`);
      return;
    }
    
    // Validate bowler and batsmen
    if (!innings.currentBowler && !nonBowlerDismissals.includes(dismissalType)) {
      console.error('No bowler selected');
      return;
    }
    if (!innings.currentBatsmen.striker) {
      console.error('No striker selected');
      return;
    }

    setLastAction({
      type: 'wicket',
      runs: 0,
      isExtra: false,
      previousState: JSON.parse(JSON.stringify(matchData))
    });

    // Update batsman stats
    // CRITICAL FIX: Use battingFirst to determine correct batting team for updating stats
    const battingTeamForWicket = updatedMatch.currentInnings === 1 ? 
      (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team1 : updatedMatch.team2) :
      (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team2 : updatedMatch.team1);
    // CRITICAL FIX: For run-out, use the selected outBatsman, otherwise use striker
    const batsmanToUpdate = dismissalType === 'runOut' ? outBatsman : innings.currentBatsmen?.striker;
    
    let dismissedBatsman: Player | undefined;
    const updatedPlayingXI = battingTeamForWicket.playingXI.map(player => {
      if (player.id === batsmanToUpdate) {
        // Create a deep copy to avoid mutation issues
        const updatedBatsman = JSON.parse(JSON.stringify(player));
        dismissedBatsman = updatedBatsman;
        return updatedBatsman; // Return the updated player
      }
      return player;
    });
    battingTeamForWicket.playingXI = updatedPlayingXI; // Assign the new array back
    
    if (dismissedBatsman) {
      dismissedBatsman.battingStats.isOut = true;
      dismissedBatsman.battingStats.dismissalType = dismissalType as DismissalType;
      // Only add ball faced if it's not a run-out or if it's not a free hit
      if (dismissalType !== 'runOut' || !freeHit) {
        // For run-out, only add ball faced if the striker was run out
        if (dismissalType !== 'runOut' || batsmanToUpdate === innings.currentBatsmen?.striker) {
          dismissedBatsman.battingStats.ballsFaced += 1;
        }
      }
    }

    // Update bowler stats
    if (dismissalType !== 'runOut') {
      // CRITICAL FIX: Use battingFirst to determine correct bowling team for wicket stats updates
      const bowlingTeam = updatedMatch.currentInnings === 1 ? 
        (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team2 : updatedMatch.team1) :
        (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team1 : updatedMatch.team2);
      const updatedPlayingXI = bowlingTeam.playingXI.map(player => {
        if (player.id === innings.currentBowler) {
          const updatedBowler = { ...player };
          updatedBowler.bowlingStats = { ...updatedBowler.bowlingStats };
          return updatedBowler;
        }
        return player;
      });
      const currentBowler = updatedPlayingXI.find(p => p.id === innings.currentBowler);
      bowlingTeam.playingXI = updatedPlayingXI;
      
      if (currentBowler) {
        currentBowler.bowlingStats.wickets += 1;
        if (!freeHit) {
          currentBowler.bowlingStats.balls += 1;
          // Update overs when 6 balls are completed
          if (currentBowler.bowlingStats.balls >= 6) {
            currentBowler.bowlingStats.overs += Math.floor(currentBowler.bowlingStats.balls / 6);
            currentBowler.bowlingStats.balls = currentBowler.bowlingStats.balls % 6;
          }
          
          // Calculate economy rate
          const totalOvers = currentBowler.bowlingStats.overs + (currentBowler.bowlingStats.balls / 6);
          currentBowler.bowlingStats.economyRate = totalOvers > 0 ? 
            currentBowler.bowlingStats.runs / totalOvers : 0;
        }
      }
    }

    innings.wickets += 1;
    
    // Handle ball count for wickets
    if (dismissalType !== 'runOut' || !freeHit) {
      innings.balls += 1;
      
      if (innings.balls === 6) {
        innings.overs += 1;
        innings.balls = 0;
        // Rotate strike at end of over
        innings.currentBatsmen = rotateStrike(innings);
        setTimeout(() => setShowBowlerModal(true), 500);
      }
    }

    // After wicket, show new batsman modal if innings is not over
    const maxWickets = (battingTeamForWicket?.playingXI?.length || 11) - 1;
    if (innings.wickets < maxWickets) {
      setShowNewBatsmanModal(true);
    }

    // Close wicket modal
    setShowWicketModal(false);
    setOutBatsman('');

    if (freeHit) setFreeHit(false);

    // Check for innings/match completion (same logic as updateScore)
    // CRITICAL FIX: Use dynamic wicket limit based on team size (team size - 1)
    const battingTeamForWicketCompletion = updatedMatch.currentInnings === 1 ? 
      (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team1 : updatedMatch.team2) :
      (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team2 : updatedMatch.team1);
    const maxWicketsForWicketCompletion = (battingTeamForWicketCompletion?.playingXI?.length || 11) - 1;
    
    const isInningsComplete = innings.wickets >= maxWicketsForWicketCompletion || innings.overs >= matchData.totalOvers;
    const isTargetReached = matchData.currentInnings === 2 && 
      matchData.innings.first && 
      innings.score >= (matchData.innings.first.score + 1);
    
    if (isInningsComplete || isTargetReached) {
      if (matchData.currentInnings === 1) {
        // Mark first innings as complete
        if (updatedMatch.innings.first) {
          updatedMatch.innings.first.isComplete = true;
        }
        // Show innings break modal
        setShowInningsBreak(true);
      } else {
        // Second innings complete - either target reached or innings ended
        if (updatedMatch.innings.second) {
          updatedMatch.innings.second.isComplete = true;
        }
        
        // Calculate match winner and result
        const winner = calculateMatchWinner(updatedMatch);
        const awards = calculateMatchAwards(updatedMatch);
        updatedMatch.winner = winner.winner;
        updatedMatch.result = winner.result;
        updatedMatch.awards = awards;
        updatedMatch.isComplete = true;
        
        // Show match completion scorecard
        setShowMatchCompletionScorecard(true);
      }
    }
    
    // Show wicket modal for new batsman selection if innings continues
    if (!isInningsComplete && !isTargetReached) {
      setShowWicketModal(true);
    }
    
    // Update match data
    setMatchData(updatedMatch);
    onScoreUpdate(updatedMatch);
  };

  // End match handler
  const handleEndMatch = () => {
    const updatedMatch = { ...matchData };
    
    // Mark match as completed
    updatedMatch.isComplete = true;
    
    // Calculate result based on current state
    const firstInnings = updatedMatch.innings.first;
    const secondInnings = updatedMatch.innings.second;
    
    if (updatedMatch.currentInnings === 1) {
      // Match ended during first innings
      updatedMatch.result = 'Match abandoned/interrupted during first innings';
      updatedMatch.winner = 'No Result';
    } else if (secondInnings) {
      // Match ended during second innings - determine winner based on current scores
      const team1Score = updatedMatch.battingFirst === updatedMatch.team1?.name ? 
        firstInnings?.score || 0 : secondInnings.score || 0;
      const team2Score = updatedMatch.battingFirst === updatedMatch.team1?.name ? 
        secondInnings.score || 0 : firstInnings?.score || 0;
      
      if (team1Score > team2Score) {
        updatedMatch.winner = updatedMatch.team1?.name || 'Team 1';
        const margin = team1Score - team2Score;
        updatedMatch.result = `${updatedMatch.winner} won by ${margin} runs (match ended early)`;
      } else if (team2Score > team1Score) {
        updatedMatch.winner = updatedMatch.team2?.name || 'Team 2';
        const margin = team2Score - team1Score;
        updatedMatch.result = `${updatedMatch.winner} won by ${margin} runs (match ended early)`;
      } else {
        updatedMatch.winner = 'Tie';
        updatedMatch.result = 'Match tied (match ended early)';
      }
    }
    
    // Calculate awards based on current performance
    const awards = calculateMatchAwards(updatedMatch);
    updatedMatch.awards = awards;
    
    // Update match and show completion scorecard
    onScoreUpdate(updatedMatch);
    setShowEndMatchModal(false);
    setShowMatchCompletionScorecard(true);
  };

  // Check if bowler needs to be selected at start of innings
  useEffect(() => {
    if (currentInnings && !currentInnings.currentBowler && currentInnings.balls === 0 && currentInnings.overs === 0) {
      // Only show bowler modal for first innings start
      // For second innings, bowler is selected during innings break setup
      if (matchData.currentInnings === 1) {
        setTimeout(() => setShowBowlerModal(true), 1000);
      }
    }
  }, [currentInnings]);

  // State for first innings completion screen
  const [showFirstInningsComplete, setShowFirstInningsComplete] = useState(false);

  // Check if we need to show first innings completion screen when resuming match
  useEffect(() => {
    // Check if first innings is complete but second innings hasn't started
    const firstInnings = matchData.innings.first;
    const secondInnings = matchData.innings.second;
    
    if (firstInnings && firstInnings.isComplete && 
        matchData.currentInnings === 1 && 
        (!secondInnings || (!secondInnings.currentBatsmen?.striker && !secondInnings.currentBatsmen?.nonStriker))) {
      
      console.log('RESUMING MATCH: First innings complete, showing completion screen');
      // Show first innings completion screen instead of automatic modal
      setShowFirstInningsComplete(true);
    }
  }, [matchData]);

  // Enhanced undo functionality with state validation
  const undoLastAction = () => {
    if (!lastAction || !lastAction.previousState) {
      console.warn('No action to undo or invalid previous state');
      return;
    }
    
    // Validate that we can safely undo (not across innings)
    if (lastAction.previousState.currentInnings !== matchData.currentInnings) {
      console.warn('Cannot undo across innings boundary');
      return;
    }
    
    // Reset any active modals/states that might be affected
    setShowWicketModal(false);
    setShowBowlerModal(false);
    setShowNewBatsmanModal(false);
    setScoreAnimation(false);
    setBoundaryAnimation(false);
    
    // Restore previous state
    onScoreUpdate(lastAction.previousState);
    setLastAction(null);
    
    console.log('Action undone successfully:', lastAction.type);
  };

  // Confirm bowler selection function
  const confirmBowlerSelection = () => {
    if (!selectedNewBowler || !currentInnings) {
      console.error('No bowler selected or invalid innings state');
      return;
    }

    const updatedMatch = { ...matchData };
    const innings = updatedMatch.currentInnings === 1 ? updatedMatch.innings.first : updatedMatch.innings.second;
    
    if (innings) {
      innings.currentBowler = selectedNewBowler;
      onScoreUpdate(updatedMatch);
      setShowBowlerModal(false);
      setSelectedNewBowler('');
      console.log('New bowler selected:', selectedNewBowler);
    }
  };

  // Show first innings completion screen with manual proceed option
  if (showFirstInningsComplete) {
    const firstInnings = matchData.innings.first;
    const battingTeamName = matchData.battingFirst === matchData.team1?.name ? matchData.team1?.name : matchData.team2?.name;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-6 mb-4">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gradient-primary mb-2">🏏 First Innings Complete</h2>
              <div className="text-xl font-semibold text-white">
                {battingTeamName}: {firstInnings?.score}/{firstInnings?.wickets}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                ({firstInnings?.overs}.{firstInnings?.balls} overs)
              </div>
            </div>

            {/* First Innings Scorecard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Batting Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gradient-primary">
                  {battingTeamName} Batting
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 px-2">Batsman</th>
                        <th className="text-center py-2">R</th>
                        <th className="text-center py-2">B</th>
                        <th className="text-center py-2">4s</th>
                        <th className="text-center py-2">6s</th>
                        <th className="text-center py-2">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const battingTeam = matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2;
                        return battingTeam?.playingXI
                          .filter(player => player.battingStats.runs > 0 || player.battingStats.ballsFaced > 0)
                          .slice(0, 8) // Show top 8 batsmen
                          .map(player => (
                            <tr key={player.id} className="border-b border-slate-800/50">
                              <td className="py-2 px-2">
                                <div className="font-medium text-white">{player.name}</div>
                                {player.battingStats.isOut && !player.battingStats.isRetiredHurt && (
                                  <div className="text-xs text-red-400">{player.battingStats.dismissalType}</div>
                                )}
                              </td>
                              <td className="text-center py-2">{player.battingStats.runs}</td>
                              <td className="text-center py-2">{player.battingStats.ballsFaced}</td>
                              <td className="text-center py-2">{player.battingStats.fours}</td>
                              <td className="text-center py-2">{player.battingStats.sixes}</td>
                              <td className="text-center py-2">{player.battingStats.strikeRate.toFixed(1)}</td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bowling Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gradient-primary">
                  {matchData.battingFirst === matchData.team1?.name ? matchData.team2?.name : matchData.team1?.name} Bowling
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 px-2">Bowler</th>
                        <th className="text-center py-2">O</th>
                        <th className="text-center py-2">R</th>
                        <th className="text-center py-2">W</th>
                        <th className="text-center py-2">ER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const bowlingTeam = matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1;
                        return bowlingTeam?.playingXI
                          .filter(player => player.bowlingStats.overs > 0 || player.bowlingStats.balls > 0)
                          .slice(0, 6) // Show top 6 bowlers
                          .map(player => (
                            <tr key={player.id} className="border-b border-slate-800/50">
                              <td className="py-2 px-2">
                                <div className="font-medium text-white">{player.name}</div>
                              </td>
                              <td className="text-center py-2">{player.bowlingStats.overs}.{player.bowlingStats.balls}</td>
                              <td className="text-center py-2">{player.bowlingStats.runs}</td>
                              <td className="text-center py-2">{player.bowlingStats.wickets}</td>
                              <td className="text-center py-2">
                                {player.bowlingStats.overs > 0 ? 
                                  (player.bowlingStats.runs / player.bowlingStats.overs).toFixed(1) : '0.0'}
                              </td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="text-center">
              <Button
                onClick={() => {
                  setShowFirstInningsComplete(false);
                  setShowInningsBreak(true);
                }}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold"
              >
                🏏 Proceed to 2nd Innings
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Show innings break modal if it's active
  if (showInningsBreak) {
    // Get teams for second innings (batting and bowling teams swap)
    const secondInningsBattingTeam = matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1;
    const secondInningsBowlingTeam = matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <GlassCard className="p-8 m-4 max-w-2xl w-full">
          <h3 className="text-2xl font-semibold mb-4 text-center">🏏 Innings Break</h3>
          
          {/* First Innings Summary */}
          <div className="text-center mb-6">
            <p className="text-slate-300 mb-2">
              {matchData.battingFirst === matchData.team1?.name ? matchData.team1?.name : matchData.team2?.name}: {matchData.innings.first?.score}/{matchData.innings.first?.wickets}
            </p>
            <p className="text-slate-300 mb-4">
              Target: {(matchData.innings.first?.score || 0) + 1} runs
            </p>
          </div>

          {/* Second Innings Setup */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-center text-purple-300">
              Setup Second Innings - {secondInningsBattingTeam?.name} Batting
            </h4>

            {/* Opening Batsmen Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Opening Striker</label>
                <select
                  value={secondInningsOpeners.striker}
                  onChange={(e) => setSecondInningsOpeners(prev => ({ ...prev, striker: e.target.value }))}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Select Striker</option>
                  {secondInningsBattingTeam?.playingXI?.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Opening Non-Striker</label>
                <select
                  value={secondInningsOpeners.nonStriker}
                  onChange={(e) => setSecondInningsOpeners(prev => ({ ...prev, nonStriker: e.target.value }))}
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Select Non-Striker</option>
                  {secondInningsBattingTeam?.playingXI?.filter(player => player.id !== secondInningsOpeners.striker).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Opening Bowler Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Opening Bowler - {secondInningsBowlingTeam?.name}</label>
              <select
                value={secondInningsOpeningBowler}
                onChange={(e) => setSecondInningsOpeningBowler(e.target.value)}
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
              >
                <option value="">Select Opening Bowler</option>
                {secondInningsBowlingTeam?.playingXI?.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Second Innings Button */}
            <div className="text-center">
              <Button
                onClick={() => {
                  if (!secondInningsOpeners.striker || !secondInningsOpeners.nonStriker || !secondInningsOpeningBowler) {
                    alert('Please select opening batsmen and bowler');
                    return;
                  }
                  
                  setShowInningsBreak(false);
                  // Start second innings with selected players
                  const updatedMatch = { ...matchData };
                  updatedMatch.currentInnings = 2;
                  
                  updatedMatch.innings.second = {
                    number: 2,
                    battingTeam: secondInningsBattingTeam?.id || '',
                    bowlingTeam: secondInningsBowlingTeam?.id || '',
                    score: 0,
                    wickets: 0,
                    overs: 0,
                    balls: 0,
                    extras: 0,
                    isComplete: false,
                    currentBatsmen: {
                      striker: secondInningsOpeners.striker,
                      nonStriker: secondInningsOpeners.nonStriker
                    },
                    currentBowler: secondInningsOpeningBowler,
                    overHistory: [],
                    ballHistory: [],
                    partnerships: [],
                    commentary: []
                  };
                  
                  onScoreUpdate(updatedMatch);
                }}
                disabled={!secondInningsOpeners.striker || !secondInningsOpeners.nonStriker || !secondInningsOpeningBowler}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3"
              >
                Start Second Innings
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!currentInnings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Setting up match...</h2>
          <p className="text-slate-300">Please complete match setup to begin scoring.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900/40 via-purple-900/30 to-slate-900/40 backdrop-blur-sm p-4">
      <div className="max-w-7xl mx-auto">
        {/* Professional Match Header */}
        <GlassCard className="p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">{matchData.team1.name} vs {matchData.team2.name}</h1>
              <span className="text-sm text-slate-400">T{matchData.totalOvers} • Match {matchData.currentInnings}/2</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Live</div>
              {freeHit && (
                <div className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded mt-1">
                  🔥 FREE HIT
                </div>
              )}
            </div>
          </div>
          
          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg">
                  {isFirstInnings ? matchData.team1.name : matchData.team2.name}
                </span>
                                  <div className={`text-2xl font-bold transition-all duration-300 ${
                    scoreAnimation ? 'scale-110 text-cyan-400' : 'text-white'
                  } ${boundaryAnimation ? 'animate-pulse' : ''}`}>
                    {currentScore}/{currentWickets}
                  </div>
              </div>
              <div className="text-sm text-slate-300">
                {currentOvers} overs • RR: {runRate}
                {!isFirstInnings && target && (
                  <> • Need {target - currentScore} runs in {(matchData.totalOvers - parseFloat(currentOvers.split('.')[0]) - (parseFloat(currentOvers.split('.')[1] || '0') / 6)).toFixed(1)} overs</>
                )}
              </div>
            </div>
            
            {!isFirstInnings && target && (
              <div className="text-right">
                <div className="text-sm text-slate-400 mb-1">Target: {target}</div>
                <div className="text-sm text-slate-400">Required RR: {requiredRunRate}</div>
              </div>
            )}
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Batting & Bowling Tables */}
          <div className="lg:col-span-2 space-y-4">
            {/* Professional Batting Scorecard */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="mr-2">🏏</span>
                {(() => {
                  // CRITICAL FIX: Use battingFirst to determine correct batting team name
                  const battingTeam = matchData.currentInnings === 1 ? 
                    (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2) :
                    (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1);
                  return battingTeam?.name || 'Unknown';
                })()} Batting
              </h3>
              

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-2">Batsman</th>
                      <th className="text-center py-2">R</th>
                      <th className="text-center py-2">B</th>
                      <th className="text-center py-2">4s</th>
                      <th className="text-center py-2">6s</th>
                      <th className="text-center py-2">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentBatsmen().map(({ player, isStriker }) => {
                      const strikeRate = player.battingStats.ballsFaced > 0 
                        ? ((player.battingStats.runs / player.battingStats.ballsFaced) * 100).toFixed(1) 
                        : '0.0';

                      return (
                        <tr key={player.id} className={`border-b border-slate-800/50 ${
                          isStriker ? 'bg-green-600/20 border-green-500/30' : 'bg-slate-700/20'
                        }`}>
                          <td className="py-3 px-2">
                            <div className="flex items-center">
                              <span className={`font-medium ${isStriker ? 'text-green-400' : 'text-white'}`}>
                                {player.name}
                                {isStriker && <span className="ml-1 text-xs text-yellow-400">*</span>}
                                {!isStriker && <span className="ml-1 text-xs text-slate-400">†</span>}
                              </span>
                            </div>
                            {player.battingStats.isOut && !player.battingStats.isRetiredHurt && (
                              <div className="text-xs text-red-400 mt-1">
                                {player.battingStats.dismissalType || 'out'}
                              </div>
                            )}
                            {player.battingStats.isRetiredHurt && (
                              <div className="text-xs text-orange-400 mt-1">
                                retired hurt
                              </div>
                            )}
                          </td>
                          <td className="text-center py-3 font-semibold">{player.battingStats.runs}</td>
                          <td className="text-center py-3">{player.battingStats.ballsFaced}</td>
                          <td className="text-center py-3">{player.battingStats.fours}</td>
                          <td className="text-center py-3">{player.battingStats.sixes}</td>
                          <td className="text-center py-3">{strikeRate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Batting Summary */}
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Extras: {currentInnings?.extras || 0}</span>
                    <span>Total: {currentScore}/{currentWickets} ({currentOvers} ov)</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Professional Bowling Scorecard */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="mr-2">⚾</span>
                {(() => {
                  // CRITICAL FIX: Use battingFirst to determine correct bowling team name
                  const bowlingTeam = matchData.currentInnings === 1 ? 
                    (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1) :
                    (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2);
                  return bowlingTeam?.name || 'Unknown';
                })()} Bowling
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-2">Bowler</th>
                      <th className="text-center py-2">O</th>
                      <th className="text-center py-2">M</th>
                      <th className="text-center py-2">R</th>
                      <th className="text-center py-2">W</th>
                      <th className="text-center py-2">ER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getBowlingTeamPlayers().map((player) => {
                      const isCurrentBowler = currentInnings?.currentBowler === player.id;
                      const isRecentBowler = currentInnings?.overHistory
                        ?.slice(-2) // Get last 2 overs
                        .some(over => over.bowler === player.id);
                      
                      // Show current bowler and recent bowlers (last 2 overs)
                      // Fallback: show first bowler if no current bowler is set
                      const hasCurrentBowler = currentInnings?.currentBowler;
                      const shouldShow = hasCurrentBowler ? 
                        (isCurrentBowler || isRecentBowler) : 
                        (getBowlingTeamPlayers().indexOf(player) === 0);
                      
                      if (!shouldShow) return null;

                      const totalOvers = player.bowlingStats.overs + (player.bowlingStats.balls / 6);
                      const economyRate = totalOvers > 0 ? 
                        (player.bowlingStats.runs / totalOvers).toFixed(2) : '0.00';

                      return (
                        <tr key={player.id} className={`border-b border-slate-800/50 ${
                          isCurrentBowler ? 'bg-purple-600/20 border-purple-500/30' : 'bg-slate-700/20'
                        }`}>
                          <td className="py-3 px-2">
                            <div className="flex items-center">
                              <span className={`font-medium ${
                                isCurrentBowler ? 'text-purple-400' : 'text-white'
                              }`}>
                                {player.name}
                                {isCurrentBowler && <span className="ml-1 text-xs text-yellow-400">*</span>}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 capitalize">
                              {player.role || 'Bowler'}
                            </div>
                          </td>
                          <td className="text-center py-3 font-semibold">
                            {player.bowlingStats.overs}.{player.bowlingStats.balls % 6}
                          </td>
                          <td className="text-center py-3">
                            0
                          </td>
                          <td className="text-center py-3">
                            {player.bowlingStats.runs}
                          </td>
                          <td className="text-center py-3 font-semibold">
                            {player.bowlingStats.wickets}
                          </td>
                          <td className="text-center py-3">
                            {economyRate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Bowling Summary */}
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>
                      Current: {getBowlingTeamPlayers().find(p => p.id === currentInnings?.currentBowler)?.name || 'No bowler selected'}
                    </span>
                    <span>
                      This over: {currentInnings?.balls || 0}/6 balls
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Commentary Panel */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="mr-2">📝</span>
                Live Commentary
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentInnings?.commentary && currentInnings.commentary.length > 0 ? (
                  currentInnings.commentary.slice(-10).reverse().map((comment, index) => (
                    <div key={index} className="text-sm bg-slate-800/30 rounded p-2 border-l-2 border-blue-500/50">
                      <div className="text-xs text-slate-400 mb-1">
                        {comment.over}.{comment.ball} - {comment.timestamp}
                      </div>
                      <div className="text-slate-200">{comment.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 text-center py-4">
                    Match commentary will appear here as the game progresses...
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Over-by-Over Breakdown */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="mr-2">📊</span>
                Over-by-Over
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {currentInnings?.overHistory && currentInnings.overHistory.length > 0 ? (
                  currentInnings.overHistory.slice(-8).map((over, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-slate-800/30 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-400">Over {over.overNumber}</span>
                        <span className="text-slate-400">
                          {getBowlingTeamPlayers().find(p => p.id === over.bowler)?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          {over.balls.map((ball, ballIndex) => (
                            <span key={ballIndex} className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                              ball.runs === 4 ? 'bg-green-600/30 text-green-400' :
                              ball.runs === 6 ? 'bg-purple-600/30 text-purple-400' :
                              ball.isWicket ? 'bg-red-600/30 text-red-400' :
                              ball.isExtra ? 'bg-orange-600/30 text-orange-400' :
                              'bg-slate-600/30 text-slate-300'
                            }`}>
                              {ball.isWicket ? 'W' : 
                               ball.isExtra ? (ball.extraType === 'wide' ? 'Wd' : 'Nb') :
                               ball.runs}
                            </span>
                          ))}
                        </div>
                        <span className="font-medium text-white">
                          {over.runs} runs
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 text-center py-4">
                    Over-by-over breakdown will appear here...
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Mobile-First Scoring Controls */}
          <div className="space-y-4">
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold mb-3">Quick Scoring</h3>
              
              {/* Main Runs - Keep as is for quick access */}
              <div className="mb-4">
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((runs) => (
                    <Button
                      key={runs}
                      onClick={() => updateScore(runs)}
                      className={`h-12 text-lg font-bold ${
                        runs === 0 ? 'bg-slate-600/20 hover:bg-slate-600/30' :
                        'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
                      }`}
                    >
                      {runs}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <Button
                    onClick={() => updateScore(4)}
                    className="h-12 text-lg font-bold bg-green-600/20 hover:bg-green-600/30 text-green-400"
                  >
                    4
                  </Button>
                  <Button
                    onClick={() => updateScore(5)}
                    className="h-12 text-lg font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                  >
                    5
                  </Button>
                  <Button
                    onClick={() => updateScore(6)}
                    className="h-12 text-lg font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-400"
                  >
                    6
                  </Button>
                  <Button
                    onClick={() => setShowWicketModal(true)}
                    className="h-12 text-lg font-bold bg-red-600/20 hover:bg-red-600/30 text-red-400"
                  >
                    OUT
                  </Button>
                </div>
              </div>

              {/* Mobile-First Extras - Single buttons that open modals */}
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => setShowWideModal(true)}
                    className="h-10 text-sm font-semibold bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400"
                  >
                    Wide
                  </Button>
                  <Button
                    onClick={() => setShowNoBallModal(true)}
                    className="h-10 text-sm font-semibold bg-orange-600/20 hover:bg-orange-600/30 text-orange-400"
                  >
                    No Ball
                  </Button>
                  <Button
                    onClick={() => setShowByeModal(true)}
                    className="h-10 text-sm font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                  >
                    Bye
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    onClick={() => setShowLegByeModal(true)}
                    className="h-10 text-sm font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400"
                  >
                    Leg Bye
                  </Button>
                  <Button
                    onClick={() => setShowNoBallByeModal(true)}
                    className="h-10 text-sm font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400"
                  >
                    NB+Bye
                  </Button>
                  <Button
                    onClick={() => setShowNoBallLegByeModal(true)}
                    className="h-10 text-sm font-semibold bg-pink-600/20 hover:bg-pink-600/30 text-pink-400"
                  >
                    NB+LB
                  </Button>
                </div>
              </div>

              {/* Professional Control Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setShowStrikerModal(true)}
                    className="bg-green-600/20 hover:bg-green-600/30 text-green-400 h-10 text-sm"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Striker
                  </Button>
                  <Button
                    onClick={() => setShowBowlerModal(true)}
                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 h-10 text-sm"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Bowler
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setShowRetiredHurtModal(true)}
                    className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 h-10 text-sm"
                  >
                    🏥 Retired Hurt
                  </Button>
                  <Button
                    onClick={undoLastAction}
                    disabled={!lastAction}
                    className="bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 h-10 text-sm disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Undo
                  </Button>
                </div>

                <Button
                  onClick={() => setShowScorecard(true)}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 h-10 text-sm"
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  📊 Scorecard
                </Button>

                
              </div>
            </GlassCard>

            {/* Commentary Panel */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold mb-3">Commentary</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="text-sm">
                  <div className="font-medium text-cyan-400 mb-1">
                    Over {Math.floor(parseFloat(currentOvers))}: {currentInnings?.currentBowler ? 
                      getBowlingTeamPlayers().find(p => p.id === currentInnings.currentBowler)?.name : 'Select Bowler'
                    }
                  </div>
                  <div className="text-slate-300">
                    {currentScore}/{currentWickets} ({currentOvers} overs)
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">
                    Last ball: {lastAction ? lastAction.type : 'No action yet'}
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Match Status */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold mb-3">Match Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Innings:</span>
                  <span>{matchData.currentInnings}/2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Overs:</span>
                  <span>{currentOvers}/{matchData.totalOvers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Run Rate:</span>
                  <span>{runRate}</span>
                </div>
                {!isFirstInnings && target && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target:</span>
                      <span>{target}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Required RR:</span>
                      <span>{requiredRunRate}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* End Match Button */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <Button
                  onClick={() => setShowEndMatchModal(true)}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-2 text-sm font-medium"
                >
                  🏁 End Match
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* All Modals */}
        {showWicketModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="p-6 m-4 max-w-lg w-full">
              <h3 className="text-xl font-semibold mb-4">Wicket Details</h3>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-3 text-slate-300">Dismissal Type</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'bowled', emoji: '🎯', label: 'Bowled' },
                    { type: 'lbw', emoji: '🦵', label: 'LBW' },
                    { type: 'caught', emoji: '🤲', label: 'Caught' },
                    { type: 'hitWicket', emoji: '💥', label: 'Hit Wicket' },
                    { type: 'runOut', emoji: '🏃', label: 'Run Out' },
                    { type: 'stumped', emoji: '🧤', label: 'Stumped' }
                  ].map(({ type, emoji, label }) => (
                    <Button
                      key={type}
                      onClick={() => setSelectedDismissalType(type as DismissalType)}
                      className={`h-10 text-sm ${
                        selectedDismissalType === type
                          ? 'bg-red-600/30 border-red-500/50 text-red-300'
                          : 'bg-slate-600/20 hover:bg-slate-600/30'
                      }`}
                    >
                      {emoji} {label}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedDismissalType === 'runOut' && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-3 text-slate-300">Select Batsman Run Out</h4>
                  <div className="space-y-2">
                    {getCurrentBatsmen().map(({ player, isStriker }) => (
                      <Button
                        key={player.id}
                        onClick={() => setOutBatsman(player.id)}
                        className={`w-full h-12 text-left px-4 ${
                          outBatsman === player.id
                            ? 'bg-red-600/30 border-red-500/50 text-red-300'
                            : 'bg-slate-600/20 hover:bg-slate-600/30'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{player.name}</span>
                          <span className="text-xs text-slate-400">{isStriker ? 'Striker' : 'Non-Striker'}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={() => handleWicket(selectedDismissalType)} 
                  disabled={selectedDismissalType === 'runOut' && !outBatsman}
                  className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 disabled:opacity-50"
                >
                  Confirm Wicket
                </Button>
                <Button onClick={() => {
                  setShowWicketModal(false);
                  setOutBatsman('');
                }} className="flex-1">
                  Cancel
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        {showBowlerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="p-6 m-4 max-w-lg w-full">
              <h3 className="text-xl font-semibold mb-4">Select Bowler for Next Over</h3>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 text-slate-300">Available Bowlers</h4>
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-3">
                    {getAvailableBowlers().map((bowler) => (
                      <Button
                        key={bowler.id}
                        onClick={() => setSelectedNewBowler(bowler.id)}
                        className={`h-12 text-left px-4 ${
                          selectedNewBowler === bowler.id
                            ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                            : 'bg-slate-600/20 hover:bg-slate-600/30'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{bowler.name}</div>
                            <div className="text-xs text-slate-400 capitalize">{bowler.role}</div>
                          </div>
                          <div className="text-xs text-slate-400">
                            {bowler.bowlingStats.overs}.{bowler.bowlingStats.balls} overs
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={confirmBowlerSelection}
                  disabled={!selectedNewBowler}
                  className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 disabled:opacity-50"
                >
                  Confirm Bowler
                </Button>
                <Button 
                  onClick={() => {
                    // Only allow closing if it's not end of over
                    if (currentInnings?.balls !== 0) {
                      setShowBowlerModal(false);
                    }
                  }} 
                  className="flex-1"
                  disabled={currentInnings?.balls === 0}
                >
                  Cancel
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Striker Selection Modal */}
        {showStrikerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="p-6 m-4 max-w-lg w-full">
              <h3 className="text-xl font-semibold mb-4">Select New Striker</h3>
              
              <div className="space-y-2 mb-6">
                {getBattingTeamPlayers()
                  .filter(player => player.id !== currentInnings?.currentBatsmen.striker && player.id !== currentInnings?.currentBatsmen.nonStriker)
                  .map(player => (
                    <Button
                      key={player.id}
                      onClick={() => {
                        // Switch striker logic
                        if (currentInnings) {
                          const updatedMatch: Match = {
                            ...matchData,
                            innings: {
                              ...matchData.innings,
                              [matchData.currentInnings === 1 ? 'first' : 'second']: {
                                ...currentInnings,
                                currentBatsmen: {
                                  ...currentInnings.currentBatsmen,
                                  striker: player.id
                                }
                              }
                            }
                          };
                          setMatchData(updatedMatch);
                        }
                        setShowStrikerModal(false);
                      }}
                      className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 h-10"
                    >
                      {player.name}
                    </Button>
                  ))}
              </div>

              <Button onClick={() => setShowStrikerModal(false)} className="w-full">
                Cancel
              </Button>
            </GlassCard>
          </div>
        )}

        {/* New Batsman Modal - MANDATORY: Cannot be dismissed without selection */}
        {showNewBatsmanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
            <GlassCard className="p-6 m-4 max-w-lg w-full">
              <h3 className="text-xl font-semibold mb-4">Select New Batsman</h3>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-3 text-slate-300">Available Batsmen</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(() => {
                    // CRITICAL FIX: Use battingFirst to determine correct batting team, same as getBattingTeamPlayers
                    const battingTeam = matchData.currentInnings === 1 ? 
                      (matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2) :
                      (matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1);
                    const battingPlayers = battingTeam?.playingXI || [];
                    
                    console.log('New Batsman Modal FIXED Debug:', {
                      currentInnings: matchData.currentInnings,
                      team1Name: matchData.team1?.name,
                      team2Name: matchData.team2?.name,
                      battingTeamName: battingTeam?.name,
                      battingTeamPlayers: battingPlayers.map(p => ({ id: p.id, name: p.name, role: p.role })),
                      striker: currentInnings?.currentBatsmen?.striker,
                      nonStriker: currentInnings?.currentBatsmen?.nonStriker
                    });
                    
                    return battingPlayers
                      .filter(player => {
                        // Filter out:
                        // 1. Current batsmen
                        const isCurrentBatsman = player.id === currentInnings?.currentBatsmen.striker || 
                                               player.id === currentInnings?.currentBatsmen.nonStriker;
                        
                        // 2. Already dismissed players (but NOT retired hurt - they can return)
                        // CRITICAL FIX: Use correct BattingStats properties (dismissalType, isRetiredHurt)
                        const isOut = player.battingStats.isOut && !player.battingStats.isRetiredHurt;
                        
                        // 3. Additional robust check: if they have a dismissal type and it's not retired hurt
                        const hasDismissalButNotRetiredHurt = player.battingStats.dismissalType && 
                                                            player.battingStats.dismissalType !== 'retiredHurt';
                        
                        console.log(`Player ${player.name} (ID: ${player.id}):`, {
                          isCurrentBatsman,
                          isOut: player.battingStats.isOut,
                          isRetiredHurt: player.battingStats.isRetiredHurt,
                          dismissalType: player.battingStats.dismissalType,
                          ballsFaced: player.battingStats.ballsFaced,
                          runs: player.battingStats.runs,
                          finalIsOut: isOut,
                          hasDismissalButNotRetiredHurt,
                          shouldShow: !isCurrentBatsman && !isOut && !hasDismissalButNotRetiredHurt
                        });
                        
                        // Show player only if:
                        // - Not current batsman
                        // - Not dismissed OR is retired hurt (can return)
                        // - Doesn't have a dismissal type (unless it's retired hurt)
                        return !isCurrentBatsman && !isOut && !hasDismissalButNotRetiredHurt;
                      });
                  })()
                    .map(player => (
                      <Button
                        key={player.id}
                        onClick={() => {
                          if (!currentInnings) return;
                          
                          const updatedMatch = { ...matchData };
                          const innings = updatedMatch.currentInnings === 1 ? 
                            updatedMatch.innings.first : updatedMatch.innings.second;
                          
                          if (!innings) return;
                          
                          // Check if this is a retired hurt player returning
                          const isRetiredHurtReturning = player.battingStats.isRetiredHurt;
                          
                          if (isRetiredHurtReturning) {
                            // Mark the player as no longer retired hurt
                            const battingTeam = updatedMatch.currentInnings === 1 ? 
                              updatedMatch.team1 : updatedMatch.team2;
                            
                            const updatedPlayingXI = battingTeam.playingXI.map(p => {
                              if (p.id === player.id) {
                                return {
                                  ...p,
                                  battingStats: {
                                    ...p.battingStats,
                                    isRetiredHurt: false // No longer retired hurt
                                  }
                                };
                              }
                              return p;
                            });
                            
                            battingTeam.playingXI = updatedPlayingXI;
                          }
                          
                          // FIXED: Properly replace the dismissed batsman while maintaining both current batsmen
                          // The dismissed batsman was either striker or non-striker (from outBatsman state)
                          // The remaining batsman stays, and new batsman takes the dismissed position
                          
                          const currentStriker = innings.currentBatsmen?.striker;
                          const currentNonStriker = innings.currentBatsmen?.nonStriker;
                          
                          console.log('New Batsman Selection Debug:', {
                            outBatsman,
                            currentStriker,
                            currentNonStriker,
                            newBatsmanId: player.id,
                            newBatsmanName: player.name
                          });
                          
                          if (outBatsman === currentStriker) {
                            // Striker was dismissed - new batsman becomes striker, non-striker stays
                            innings.currentBatsmen = {
                              striker: player.id,
                              nonStriker: currentNonStriker || currentStriker // Fallback if nonStriker is missing
                            };
                          } else if (outBatsman === currentNonStriker) {
                            // Non-striker was dismissed - new batsman becomes non-striker, striker stays
                            innings.currentBatsmen = {
                              striker: currentStriker || currentNonStriker, // Fallback if striker is missing
                              nonStriker: player.id
                            };
                          } else {
                            // Fallback: if outBatsman doesn't match, assume striker was dismissed
                            // Also ensure we have a valid non-striker
                            const remainingBatsman = currentNonStriker || currentStriker;
                            innings.currentBatsmen = {
                              striker: player.id,
                              nonStriker: remainingBatsman === player.id ? currentStriker : remainingBatsman
                            };
                          }
                          
                          // CRITICAL: Ensure both positions are filled and different
                          if (!innings.currentBatsmen.striker || !innings.currentBatsmen.nonStriker) {
                            console.error('CRITICAL: Missing batsman after replacement!', innings.currentBatsmen);
                            // Emergency fallback: find any two available batsmen
                            const battingTeam = updatedMatch.currentInnings === 1 ? 
                              (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team1 : updatedMatch.team2) :
                              (updatedMatch.battingFirst === updatedMatch.team1?.name ? updatedMatch.team2 : updatedMatch.team1);
                            
                            const availableBatsmen = battingTeam?.playingXI?.filter(p => 
                              !p.battingStats.isOut || p.battingStats.isRetiredHurt
                            ) || [];
                            
                            if (availableBatsmen.length >= 2) {
                              innings.currentBatsmen = {
                                striker: player.id,
                                nonStriker: availableBatsmen.find(p => p.id !== player.id)?.id || availableBatsmen[1]?.id
                              };
                            }
                          }
                          
                          console.log('Final current batsmen after replacement:', innings.currentBatsmen);
                          
                          setMatchData(updatedMatch);
                          onScoreUpdate(updatedMatch);
                          setShowNewBatsmanModal(false);
                        }}
                        className={`w-full h-12 ${
                          player.battingStats.isRetiredHurt 
                            ? 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-400' 
                            : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{player.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 capitalize">{player.role}</span>
                            {player.battingStats.isRetiredHurt && (
                              <span className="text-xs text-orange-400">🏥 Retired Hurt</span>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                </div>
              </div>

              <div className="text-center text-sm text-slate-400 mt-4">
                ⚠️ You must select a new batsman to continue scoring
              </div>
            </GlassCard>
          </div>
        )}

        {/* Retired Hurt Modal */}
        {showRetiredHurtModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="p-6 m-4 max-w-lg w-full">
              <h3 className="text-xl font-semibold mb-4">🏥 Retired Hurt</h3>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-3 text-slate-300">Select Batsman to Retire</h4>
                <div className="space-y-2">
                  {[
                    { id: currentInnings?.currentBatsmen.striker, position: 'Striker' },
                    { id: currentInnings?.currentBatsmen.nonStriker, position: 'Non-Striker' }
                  ]
                    .filter(({id}) => id)
                    .map(({id, position}) => {
                    const player = getBattingTeamPlayers().find(p => p.id === id);
                    return player ? (
                      <Button
                        key={player.id}
                        onClick={() => {
                          if (!currentInnings) return;
                          
                          const updatedMatch = { ...matchData };
                          const innings = updatedMatch.currentInnings === 1 ? 
                            updatedMatch.innings.first : updatedMatch.innings.second;
                          
                          if (!innings) return;

                          // Mark batsman as retired hurt (NOT out - they can return)
                          const battingTeam = updatedMatch.currentInnings === 1 ? 
                            updatedMatch.team1 : updatedMatch.team2;
                          
                          const updatedPlayingXI = battingTeam.playingXI.map(p => {
                            if (p.id === player.id) {
                              return {
                                ...p,
                                battingStats: {
                                  ...p.battingStats,
                                  isOut: false, // NOT out - they can return
                                  isRetiredHurt: true, // Mark as retired hurt
                                  dismissalType: undefined // No dismissal type
                                }
                              };
                            }
                            return p;
                          });
                          
                          battingTeam.playingXI = updatedPlayingXI;
                          
                          // Set outBatsman for new batsman selection
                          setOutBatsman(player.id);
                          setShowRetiredHurtModal(false);
                          setShowNewBatsmanModal(true);
                        }}
                        className="w-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 h-12"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{player.name}</span>
                          <span className="text-xs text-slate-400">{position}</span>
                        </div>
                      </Button>
                    ) : null;
                  })}
                </div>
              </div>

              <Button onClick={() => setShowRetiredHurtModal(false)} className="w-full">
                Cancel
              </Button>
            </GlassCard>
          </div>
        )}

        {/* Professional Scorecard Modal */}
        {showScorecard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold">📊 Match Scorecard</h3>
                <Button onClick={() => setShowScorecard(false)} className="bg-red-600/20 hover:bg-red-600/30 text-red-400">
                  ✕ Close
                </Button>
              </div>

              {/* Match Summary */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-cyan-400">Match Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-green-400">{matchData.team1.name}</h5>
                    <p className="text-2xl font-bold">
                      {matchData.innings.first?.score || 0}/{matchData.innings.first?.wickets || 0}
                    </p>
                    <p className="text-sm text-slate-400">
                      ({matchData.innings.first?.overs || 0} overs)
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-purple-400">{matchData.team2.name}</h5>
                    <p className="text-2xl font-bold">
                      {matchData.innings.second?.score || 0}/{matchData.innings.second?.wickets || 0}
                    </p>
                    <p className="text-sm text-slate-400">
                      ({matchData.innings.second?.overs || 0} overs)
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Statistics */}
              <div className="space-y-6">
                {/* First Innings */}
                {matchData.innings.first && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-green-400">
                      {matchData.team1.name} Batting
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left p-2">Batsman</th>
                            <th className="text-center p-2">R</th>
                            <th className="text-center p-2">B</th>
                            <th className="text-center p-2">4s</th>
                            <th className="text-center p-2">6s</th>
                            <th className="text-center p-2">SR</th>
                            <th className="text-left p-2">Dismissal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchData.team1.playingXI && matchData.team1.playingXI.length > 0 ? (
                            matchData.team1.playingXI.map((player) => {
                              const battingStats = player.battingStats;
                              return (
                                <tr key={player.id} className="border-b border-slate-700/50">
                                  <td className="p-2 font-medium">{player.name}</td>
                                  <td className="text-center p-2">{battingStats.runs}</td>
                                  <td className="text-center p-2">{battingStats.ballsFaced}</td>
                                  <td className="text-center p-2">{battingStats.fours}</td>
                                  <td className="text-center p-2">{battingStats.sixes}</td>
                                  <td className="text-center p-2">
                                    {battingStats.ballsFaced > 0 ? ((battingStats.runs / battingStats.ballsFaced) * 100).toFixed(1) : '0.0'}
                                  </td>
                                  <td className="p-2 text-slate-400">{battingStats.status}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={7} className="p-4 text-center text-slate-400">
                                No players in playing XI
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Second Innings */}
                {matchData.innings.second && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-purple-400">
                      {matchData.team2.name} Batting
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left p-2">Batsman</th>
                            <th className="text-center p-2">R</th>
                            <th className="text-center p-2">B</th>
                            <th className="text-center p-2">4s</th>
                            <th className="text-center p-2">6s</th>
                            <th className="text-center p-2">SR</th>
                            <th className="text-left p-2">Dismissal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchData.team2.playingXI && matchData.team2.playingXI.length > 0 ? (
                            matchData.team2.playingXI.map((player) => {
                              const battingStats = player.battingStats;
                              return (
                                <tr key={player.id} className="border-b border-slate-700/50">
                                  <td className="p-2 font-medium">{player.name}</td>
                                  <td className="text-center p-2">{battingStats.runs}</td>
                                  <td className="text-center p-2">{battingStats.ballsFaced}</td>
                                  <td className="text-center p-2">{battingStats.fours}</td>
                                  <td className="text-center p-2">{battingStats.sixes}</td>
                                  <td className="text-center p-2">
                                    {battingStats.ballsFaced > 0 ? ((battingStats.runs / battingStats.ballsFaced) * 100).toFixed(1) : '0.0'}
                                  </td>
                                  <td className="p-2 text-slate-400">{battingStats.status}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={7} className="p-4 text-center text-slate-400">
                                No players in playing XI
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Innings Break Modal */}
        {showInningsBreak && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="p-8 m-4 max-w-lg w-full text-center">
              <h3 className="text-2xl font-semibold mb-4">🏏 Innings Break</h3>
              <p className="text-slate-300 mb-2">
                {matchData.team1.name}: {matchData.innings.first?.score}/{matchData.innings.first?.wickets}
              </p>
              <p className="text-slate-300 mb-6">
                Target: {(matchData.innings.first?.score || 0) + 1} runs
              </p>
              <Button
                onClick={() => {
                  // Initialize second innings
                  const updatedMatch = { ...matchData };
                  
                  // Create second innings if it doesn't exist
                  if (!updatedMatch.innings.second) {
                    updatedMatch.innings.second = {
                      number: 2,
                      battingTeam: matchData.team2.name,
                      bowlingTeam: matchData.team1.name,
                      score: 0,
                      wickets: 0,
                      overs: 0,
                      balls: 0,
                      extras: 0,
                      target: (matchData.innings.first?.score || 0) + 1,
                      isComplete: false,
                      currentBatsmen: {
                        striker: matchData.team2.playingXI[0]?.id || '',
                        nonStriker: matchData.team2.playingXI[1]?.id || ''
                      },
                      currentBowler: matchData.team1.playingXI[0]?.id || '',
                      overHistory: [],
                      ballHistory: [],
                      partnerships: [],
                      commentary: []
                    };
                  }
                  
                  // Switch to second innings
                  updatedMatch.currentInnings = 2;
                  
                  // Initialize batting stats for team 2
                  matchData.team2.playingXI.forEach(player => {
                    if (!player.battingStats) {
                      player.battingStats = {
                        runs: 0,
                        ballsFaced: 0,
                        fours: 0,
                        sixes: 0,
                        strikeRate: 0,
                        status: 'not out',
                        isOut: false,
                        isRetiredHurt: false
                      };
                    }
                  });
                  
                  // Initialize bowling stats for team 1
                  matchData.team1.playingXI.forEach(player => {
                    if (!player.bowlingStats) {
                      player.bowlingStats = {
                        overs: 0,
                        runs: 0,
                        wickets: 0,
                        economyRate: 0,
                        balls: 0,
                        wides: 0,
                        noBalls: 0
                      };
                    }
                  });
                  
                  setShowInningsBreak(false);
                  onScoreUpdate(updatedMatch);
                }}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-400"
              >
                Start Second Innings
              </Button>
            </GlassCard>
          </div>
        )}

        {showMatchCompletionScorecard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Match Result Header */}
              <div className="text-center mb-6">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
                <h2 className="text-2xl font-bold mb-2">🏏 Match Complete</h2>
                <div className="text-lg font-semibold text-purple-300 mb-2">
                  {matchData.winner === 'Tie' ? 'Match Tied!' : `${matchData.winner} Wins!`}
                </div>
                <div className="text-sm text-slate-400">
                  {matchData.team1?.name} vs {matchData.team2?.name} • {matchData.totalOvers} Overs
                </div>
              </div>

              {/* Both Innings Scorecards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* First Innings Scorecard */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center text-blue-300 border-b border-slate-600 pb-2">
                    First Innings - {matchData.battingFirst === matchData.team1?.name ? matchData.team1?.name : matchData.team2?.name}
                  </h3>
                  
                  {/* First Innings Score Summary */}
                  <div className="text-center bg-slate-800/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">
                      {matchData.innings.first?.score || 0}/{matchData.innings.first?.wickets || 0}
                    </div>
                    <div className="text-sm text-slate-400">
                      {matchData.innings.first?.overs || 0}.{matchData.innings.first?.balls || 0} overs
                      {matchData.innings.first && (
                        <span className="ml-2">
                          (RR: {matchData.innings.first.overs > 0 ? 
                            ((matchData.innings.first.score / (matchData.innings.first.overs + (matchData.innings.first.balls / 6))) || 0).toFixed(2) : '0.00'})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* First Innings Batting */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">🏏 Batting</h4>
                    <div className="bg-slate-800/30 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-6 gap-2 p-2 text-xs font-semibold text-slate-400 border-b border-slate-600">
                        <div>Batsman</div>
                        <div className="text-center">R</div>
                        <div className="text-center">B</div>
                        <div className="text-center">4s</div>
                        <div className="text-center">6s</div>
                        <div className="text-center">SR</div>
                      </div>
                      {(() => {
                        const firstInningsBattingTeam = matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2;
                        return firstInningsBattingTeam?.playingXI?.filter(player => 
                          player.battingStats.ballsFaced > 0 || player.battingStats.runs > 0
                        ).map(player => (
                          <div key={player.id} className="grid grid-cols-6 gap-2 p-2 text-xs border-b border-slate-700/50">
                            <div className="font-medium">
                              {player.name}
                              {player.battingStats.isOut && (
                                <div className="text-red-400 text-[10px]">
                                  {player.battingStats.dismissalType}
                                </div>
                              )}
                            </div>
                            <div className="text-center">{player.battingStats.runs}</div>
                            <div className="text-center">{player.battingStats.ballsFaced}</div>
                            <div className="text-center">{player.battingStats.fours}</div>
                            <div className="text-center">{player.battingStats.sixes}</div>
                            <div className="text-center">{player.battingStats.strikeRate.toFixed(1)}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* First Innings Bowling */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">⚾ Bowling</h4>
                    <div className="bg-slate-800/30 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-5 gap-2 p-2 text-xs font-semibold text-slate-400 border-b border-slate-600">
                        <div>Bowler</div>
                        <div className="text-center">O</div>
                        <div className="text-center">R</div>
                        <div className="text-center">W</div>
                        <div className="text-center">ER</div>
                      </div>
                      {(() => {
                        const firstInningsBowlingTeam = matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1;
                        return firstInningsBowlingTeam?.playingXI?.filter(player => 
                          player.bowlingStats.overs > 0 || player.bowlingStats.balls > 0 || player.bowlingStats.runs > 0
                        ).map(player => (
                          <div key={player.id} className="grid grid-cols-5 gap-2 p-2 text-xs border-b border-slate-700/50">
                            <div className="font-medium">{player.name}</div>
                            <div className="text-center">{player.bowlingStats.overs}.{player.bowlingStats.balls}</div>
                            <div className="text-center">{player.bowlingStats.runs}</div>
                            <div className="text-center">{player.bowlingStats.wickets}</div>
                            <div className="text-center">{player.bowlingStats.economyRate.toFixed(2)}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Second Innings Scorecard */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center text-green-300 border-b border-slate-600 pb-2">
                    Second Innings - {matchData.battingFirst === matchData.team1?.name ? matchData.team2?.name : matchData.team1?.name}
                  </h3>
                  
                  {/* Second Innings Score Summary */}
                  <div className="text-center bg-slate-800/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400">
                      {matchData.innings.second?.score || 0}/{matchData.innings.second?.wickets || 0}
                    </div>
                    <div className="text-sm text-slate-400">
                      {matchData.innings.second?.overs || 0}.{matchData.innings.second?.balls || 0} overs
                      {matchData.innings.second && (
                        <span className="ml-2">
                          (RR: {matchData.innings.second.overs > 0 ? 
                            ((matchData.innings.second.score / (matchData.innings.second.overs + (matchData.innings.second.balls / 6))) || 0).toFixed(2) : '0.00'})
                        </span>
                      )}
                    </div>
                    {matchData.innings.first && (
                      <div className="text-xs text-purple-300 mt-1">
                        Target: {(matchData.innings.first.score || 0) + 1} • 
                        Need: {Math.max(0, (matchData.innings.first.score || 0) + 1 - (matchData.innings.second?.score || 0))} runs
                      </div>
                    )}
                  </div>

                  {/* Second Innings Batting */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">🏏 Batting</h4>
                    <div className="bg-slate-800/30 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-6 gap-2 p-2 text-xs font-semibold text-slate-400 border-b border-slate-600">
                        <div>Batsman</div>
                        <div className="text-center">R</div>
                        <div className="text-center">B</div>
                        <div className="text-center">4s</div>
                        <div className="text-center">6s</div>
                        <div className="text-center">SR</div>
                      </div>
                      {(() => {
                        const secondInningsBattingTeam = matchData.battingFirst === matchData.team1?.name ? matchData.team2 : matchData.team1;
                        return secondInningsBattingTeam?.playingXI?.filter(player => 
                          player.battingStats.ballsFaced > 0 || player.battingStats.runs > 0
                        ).map(player => (
                          <div key={player.id} className="grid grid-cols-6 gap-2 p-2 text-xs border-b border-slate-700/50">
                            <div className="font-medium">
                              {player.name}
                              {player.battingStats.isOut && (
                                <div className="text-red-400 text-[10px]">
                                  {player.battingStats.dismissalType}
                                </div>
                              )}
                            </div>
                            <div className="text-center">{player.battingStats.runs}</div>
                            <div className="text-center">{player.battingStats.ballsFaced}</div>
                            <div className="text-center">{player.battingStats.fours}</div>
                            <div className="text-center">{player.battingStats.sixes}</div>
                            <div className="text-center">{player.battingStats.strikeRate.toFixed(1)}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Second Innings Bowling */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">⚾ Bowling</h4>
                    <div className="bg-slate-800/30 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-5 gap-2 p-2 text-xs font-semibold text-slate-400 border-b border-slate-600">
                        <div>Bowler</div>
                        <div className="text-center">O</div>
                        <div className="text-center">R</div>
                        <div className="text-center">W</div>
                        <div className="text-center">ER</div>
                      </div>
                      {(() => {
                        const secondInningsBowlingTeam = matchData.battingFirst === matchData.team1?.name ? matchData.team1 : matchData.team2;
                        return secondInningsBowlingTeam?.playingXI?.filter(player => 
                          player.bowlingStats.overs > 0 || player.bowlingStats.balls > 0 || player.bowlingStats.runs > 0
                        ).map(player => (
                          <div key={player.id} className="grid grid-cols-5 gap-2 p-2 text-xs border-b border-slate-700/50">
                            <div className="font-medium">{player.name}</div>
                            <div className="text-center">{player.bowlingStats.overs}.{player.bowlingStats.balls}</div>
                            <div className="text-center">{player.bowlingStats.runs}</div>
                            <div className="text-center">{player.bowlingStats.wickets}</div>
                            <div className="text-center">{player.bowlingStats.economyRate.toFixed(2)}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Summary */}
              <div className="mt-6 pt-4 border-t border-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-slate-400">Match Format</div>
                    <div className="font-semibold">{matchData.totalOvers} Overs</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Result</div>
                    <div className="font-semibold text-yellow-400">
                      {matchData.winner === 'Tie' ? 'Match Tied' : `${matchData.winner} Won`}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Margin</div>
                    <div className="font-semibold">
                      {matchData.winner === 'Tie' ? 'Tie' : 
                        matchData.currentInnings === 2 && matchData.innings.second?.score && matchData.innings.first?.score ?
                          (matchData.innings.second.score > matchData.innings.first.score ? 
                            `${10 - (matchData.innings.second.wickets || 0)} wickets` :
                            `${(matchData.innings.first.score || 0) - (matchData.innings.second.score || 0)} runs`
                          ) : 'Match Complete'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Awards Section */}
              {matchData.awards && (
                <div className="mt-6 pt-4 border-t border-slate-600">
                  <h3 className="text-lg font-semibold text-gradient-primary mb-4 text-center">🏆 Match Awards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Best Batsman */}
                    {matchData.awards.bestBatsman && (
                      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-yellow-400 font-semibold mb-2">🏏 Best Batsman</div>
                        <div className="font-bold text-lg">{matchData.awards.bestBatsman.name}</div>
                        <div className="text-sm text-slate-400">
                          {matchData.awards.bestBatsman.battingStats.runs} runs 
                          ({matchData.awards.bestBatsman.battingStats.ballsFaced} balls)
                        </div>
                        <div className="text-xs text-slate-500">
                          SR: {matchData.awards.bestBatsman.battingStats.strikeRate.toFixed(1)}
                        </div>
                      </div>
                    )}

                    {/* Best Bowler */}
                    {matchData.awards.bestBowler && (
                      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-blue-400 font-semibold mb-2">🎳 Best Bowler</div>
                        <div className="font-bold text-lg">{matchData.awards.bestBowler.name}</div>
                        <div className="text-sm text-slate-400">
                          {matchData.awards.bestBowler.bowlingStats.wickets} wickets
                        </div>
                        <div className="text-xs text-slate-500">
                          {matchData.awards.bestBowler.bowlingStats.overs}.{matchData.awards.bestBowler.bowlingStats.balls} overs, 
                          {matchData.awards.bestBowler.bowlingStats.runs} runs
                        </div>
                        <div className="text-xs text-slate-500">
                          Econ: {matchData.awards.bestBowler.bowlingStats.overs > 0 ? 
                            (matchData.awards.bestBowler.bowlingStats.runs / matchData.awards.bestBowler.bowlingStats.overs).toFixed(1) : '0.0'}
                        </div>
                      </div>
                    )}

                    {/* Man of the Match */}
                    {matchData.awards.manOfTheMatch && (
                      <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 text-center border border-yellow-500/30">
                        <div className="text-yellow-300 font-semibold mb-2">⭐ Man of the Match</div>
                        <div className="font-bold text-xl text-yellow-200">{matchData.awards.manOfTheMatch.name}</div>
                        <div className="text-sm text-yellow-100 mt-2">
                          {matchData.awards.manOfTheMatch.battingStats.runs > 0 && (
                            <div>{matchData.awards.manOfTheMatch.battingStats.runs} runs</div>
                          )}
                          {matchData.awards.manOfTheMatch.bowlingStats.wickets > 0 && (
                            <div>{matchData.awards.manOfTheMatch.bowlingStats.wickets} wickets</div>
                          )}
                          {matchData.awards.manOfTheMatch.fieldingStats.catches > 0 && (
                            <div>{matchData.awards.manOfTheMatch.fieldingStats.catches} catches</div>
                          )}
                        </div>
                        <div className="text-xs text-yellow-300 mt-1">Most Valuable Player</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Go to Home Screen Button */}
              <div className="text-center mt-6">
                <Button
                  onClick={() => {
                    // Close the scorecard and navigate to home screen
                    setShowMatchCompletionScorecard(false);
                    // Navigate back to home screen if function is provided
                    if (onNavigateHome) {
                      onNavigateHome();
                    }
                  }}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold"
                >
                  🏠 Go to Home Screen
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Mobile-First Extra Modals */}
        
        {/* Wide Modal */}
        {showWideModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Wide + Runs</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[0, 1, 2, 3, 4].map((runs) => (
                  <Button
                    key={runs}
                    onClick={() => {
                      updateScore(runs + 1, true, 'wide');
                      setShowWideModal(false);
                    }}
                    className="h-12 text-lg font-semibold bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400"
                  >
                    WD+{runs}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setShowWideModal(false)}
                className="w-full bg-slate-600/20 hover:bg-slate-600/30"
              >
                Cancel
              </Button>
            </GlassCard>
          </div>
        )}

        {/* No Ball Modal */}
        {showNoBallModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-orange-400">No Ball + Runs</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[0, 1, 2, 3, 4, 6].map((runs) => (
                  <Button
                    key={runs}
                    onClick={() => {
                      updateScore(runs + 1, true, 'noball');
                      setShowNoBallModal(false);
                    }}
                    className="h-12 text-lg font-semibold bg-orange-600/20 hover:bg-orange-600/30 text-orange-400"
                  >
                    NB+{runs}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setShowNoBallModal(false)}
                className="w-full bg-slate-600/20 hover:bg-slate-600/30"
              >
                Cancel
              </Button>
            </GlassCard>
          </div>
        )}

        {/* Bye Modal */}
        {showByeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Byes</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[1, 2, 3, 4].map((runs) => (
                  <Button
                    key={runs}
                    onClick={() => {
                      updateScore(runs, true, 'bye');
                      setShowByeModal(false);
                    }}
                    className="h-12 text-lg font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                  >
                    B+{runs}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setShowByeModal(false)}
                className="w-full bg-slate-600/20 hover:bg-slate-600/30"
              >
                Cancel
              </Button>
            </GlassCard>
          </div>
        )}

        {/* Leg Bye Modal */}
        {showLegByeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-indigo-400">Leg Byes</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[1, 2, 3, 4].map((runs) => (
                  <Button
                    key={runs}
                    onClick={() => {
                      updateScore(runs, true, 'legbye');
                      setShowLegByeModal(false);
                    }}
                    className="h-12 text-lg font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400"
                  >
                    LB+{runs}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setShowLegByeModal(false)}
                className="w-full bg-slate-600/20 hover:bg-slate-600/30"
              >
                Cancel
              </Button>
            </GlassCard>
          </div>
        )}

        {/* No Ball + Bye Modal */}
        {showNoBallByeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">No Ball + Byes</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[1, 2, 3, 4].map((runs) => (
                  <Button
                    key={runs}
                    onClick={() => {
                      updateScore(runs + 1, true, 'noball-bye');
                      setShowNoBallByeModal(false);
                    }}
                    className="h-12 text-lg font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400"
                  >
                    NB+{runs}B
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setShowNoBallByeModal(false)}
                className="w-full bg-slate-600/20 hover:bg-slate-600/30"
              >
                Cancel
              </Button>
            </GlassCard>
          </div>
        )}

        {/* No Ball + Leg Bye Modal */}
        {showNoBallLegByeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <GlassCard className="p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4 text-pink-400">No Ball + Leg Byes</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[1, 2, 3, 4].map((runs) => (
                  <Button
                    key={runs}
                    onClick={() => {
                      updateScore(runs + 1, true, 'noball-legbye');
                      setShowNoBallLegByeModal(false);
                    }}
                    className="h-12 text-lg font-semibold bg-pink-600/20 hover:bg-pink-600/30 text-pink-400"
                  >
                    NB+{runs}LB
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setShowNoBallLegByeModal(false)}
                className="w-full bg-slate-600/20 hover:bg-slate-600/30"
              >
                Cancel
              </Button>
            </GlassCard>
          </div>
        )}

        {/* End Match Confirmation Modal */}
        {showEndMatchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <GlassCard className="p-6 m-4 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4 text-center">🏁 End Match</h3>
              
              <div className="mb-6">
                <p className="text-slate-300 text-center mb-4">
                  Are you sure you want to end this match?
                </p>
                <p className="text-slate-400 text-sm text-center">
                  This action will complete the match with current scores and cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowEndMatchModal(false)}
                  className="flex-1 bg-slate-600/20 hover:bg-slate-600/30 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEndMatch}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
                >
                  End Match
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalScoringInterfaceV3;
