import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Match, Player } from '@/types/cricket';
import { RotateCcw, Trophy, ArrowLeft } from 'lucide-react';

// Import our new modular components
import Scoreboard from './scoring/Scoreboard';
import QuickScoring from './scoring/QuickScoring';
import MatchStatistics from './scoring/MatchStatistics';
import WicketModal from './scoring/WicketModal';
import NewBatsmanModal from './scoring/NewBatsmanModal';
import ExtrasModal from './scoring/ExtrasModal';
import ConfirmationDialog from './ui/ConfirmationDialog';
import Modal from './ui/Modal';

// Import our new hooks and utilities
import { useMatchScoring } from '@/hooks/useMatchScoring';
import { cricketFeedback, cricketToast } from '@/utils/toast';
import { CRICKET_CONSTANTS, cricketUtils } from '@/constants/cricket';

interface ProfessionalScoringInterfaceProps {
  matchData: Match;
  onScoreUpdate: (match: Match) => void;
  onNavigateHome?: () => void;
}

const ProfessionalScoringInterfaceV4: React.FC<ProfessionalScoringInterfaceProps> = ({
  matchData,
  onScoreUpdate,
  onNavigateHome
}) => {
  // Use our custom hook for scoring logic
  const {
    lastAction,
    freeHit,
    updateScore,
    handleWicket,
    undoLastAction,
    rotateStrike,
    currentInnings,
    battingTeam,
    bowlingTeam,
    isMatchComplete,
    isInningsComplete
  } = useMatchScoring(matchData, onScoreUpdate);

  // Modal states
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showNewBatsmanModal, setShowNewBatsmanModal] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);

  // Modal data states
  const [extrasModalType, setExtrasModalType] = useState<'wide' | 'noball' | 'bye' | 'legbye' | 'noball-bye' | 'noball-legbye'>('wide');
  const [dismissedBatsmanId, setDismissedBatsmanId] = useState<string>('');
  const [selectedNewBowler, setSelectedNewBowler] = useState<string>('');

  // Animation states
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [boundaryAnimation, setBoundaryAnimation] = useState(false);

  // Get current batsmen with proper error handling
  const currentBatsmen = useMemo(() => {
    if (!currentInnings || !battingTeam) return null;

    const striker = battingTeam.playingXI.find((p: Player) => p.id === currentInnings.currentBatsmen.striker);
    const nonStriker = battingTeam.playingXI.find((p: Player) => p.id === currentInnings.currentBatsmen.nonStriker);

    if (!striker || !nonStriker) return null;

    return { striker, nonStriker };
  }, [currentInnings, battingTeam]);

  // Get current bowler
  const currentBowler = useMemo(() => {
    if (!currentInnings || !bowlingTeam) return null;
    return bowlingTeam.playingXI.find((p: Player) => p.id === currentInnings.currentBowler) || null;
  }, [currentInnings, bowlingTeam]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if modals are open or if typing in an input
      if (showWicketModal || showNewBatsmanModal || showExtrasModal || showScorecard || 
          event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case '0': case '1': case '2': case '3': case '4': case '6':
          handleScoreUpdate(parseInt(event.key));
          break;
        case 'w': case 'W':
          handleWicketClick();
          break;
        case ' ': // Space for dot ball
          event.preventDefault();
          handleScoreUpdate(0);
          break;
        case 'u': case 'U':
          handleUndo();
          break;
        case 's': case 'S':
          rotateStrike();
          cricketFeedback.scoreUpdate(0); // Generic feedback for strike rotation
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showWicketModal, showNewBatsmanModal, showExtrasModal, showScorecard]);

  // Handle score update with animations
  const handleScoreUpdate = useCallback((runs: number) => {
    console.log('🎯 V4 INTERFACE: handleScoreUpdate called with runs:', runs);
    const success = updateScore(runs);
    console.log('🎯 V4 INTERFACE: updateScore returned:', success);
    
    if (success) {
      // Trigger animations
      setScoreAnimation(true);
      setTimeout(() => setScoreAnimation(false), CRICKET_CONSTANTS.ANIMATION_DURATION);

      if (runs === 4 || runs === 6) {
        setBoundaryAnimation(true);
        setTimeout(() => setBoundaryAnimation(false), CRICKET_CONSTANTS.BOUNDARY_ANIMATION_DURATION);
      }

      // Check for over completion
      if (currentInnings && currentInnings.balls === 5) { // Will become 0 after this ball
        setTimeout(() => {
          setShowBowlerModal(true);
        }, 1000);
      }
    }
  }, [updateScore, currentInnings]);

  // Handle wicket click
  const handleWicketClick = useCallback(() => {
    if (freeHit) {
      cricketFeedback.error('Cannot take wicket on free hit (except run out)');
      return;
    }
    setShowWicketModal(true);
  }, [freeHit]);

  // Handle wicket confirmation
  const handleWicketConfirm = useCallback((dismissalType: string, outBatsman?: string) => {
    const success = handleWicket(dismissalType, outBatsman);
    
    if (success) {
      setDismissedBatsmanId(outBatsman || currentInnings?.currentBatsmen.striker || '');
      
      // Check if new batsman is needed
      if (!isInningsComplete && !isMatchComplete) {
        setTimeout(() => {
          setShowNewBatsmanModal(true);
        }, 1000);
      }
    }
    
    setShowWicketModal(false);
  }, [handleWicket, currentInnings, isInningsComplete, isMatchComplete]);

  // Handle new batsman selection
  const handleNewBatsmanConfirm = useCallback((newBatsmanId: string) => {
    if (!currentInnings || !battingTeam) return;

    const updatedMatch = { ...matchData };
    const innings = updatedMatch.currentInnings === 1 ? updatedMatch.innings.first : updatedMatch.innings.second;
    
    if (innings) {
      // Replace the dismissed batsman
      if (dismissedBatsmanId === innings.currentBatsmen.striker) {
        innings.currentBatsmen.striker = newBatsmanId;
      } else {
        innings.currentBatsmen.nonStriker = newBatsmanId;
      }
      
      onScoreUpdate(updatedMatch);
      cricketToast.info.newBatsman(
        battingTeam.playingXI.find((p: Player) => p.id === newBatsmanId)?.name || 'New batsman'
      );
    }
    
    setShowNewBatsmanModal(false);
    setDismissedBatsmanId('');
  }, [matchData, currentInnings, battingTeam, dismissedBatsmanId, onScoreUpdate]);

  // Handle extras
  const handleExtrasClick = useCallback((extraType: string) => {
    setExtrasModalType(extraType as any);
    setShowExtrasModal(true);
  }, []);

  const handleExtrasConfirm = useCallback((runs: number, extraType: string) => {
    updateScore(runs, true, extraType as any);
    setShowExtrasModal(false);
  }, [updateScore]);

  // Handle undo
  const handleUndo = useCallback(() => {
    undoLastAction();
  }, [undoLastAction]);

  // Handle end match
  const handleEndMatch = useCallback(() => {
    const updatedMatch = { ...matchData };
    updatedMatch.isComplete = true;
    updatedMatch.isLive = false;
    
    // Calculate final result
    const result = cricketUtils.calculateMatchResult(updatedMatch);
    updatedMatch.winner = result.winner;
    updatedMatch.result = result.result;
    
    onScoreUpdate(updatedMatch);
    cricketToast.success.matchCompleted(result.result);
    setShowEndMatchModal(false);
  }, [matchData, onScoreUpdate]);

  // Handle bowler change
  const handleBowlerChange = useCallback(() => {
    if (!selectedNewBowler || !currentInnings) return;

    const updatedMatch = { ...matchData };
    const innings = updatedMatch.currentInnings === 1 ? updatedMatch.innings.first : updatedMatch.innings.second;
    
    if (innings) {
      innings.currentBowler = selectedNewBowler;
      onScoreUpdate(updatedMatch);
      
      const bowlerName = bowlingTeam?.playingXI.find((p: Player) => p.id === selectedNewBowler)?.name || 'New bowler';
      cricketToast.info.bowlerChange(bowlerName);
    }
    
    setShowBowlerModal(false);
    setSelectedNewBowler('');
  }, [selectedNewBowler, matchData, currentInnings, bowlingTeam, onScoreUpdate]);

  // Get available bowlers for bowler change
  const availableBowlers = useMemo(() => {
    if (!bowlingTeam || !currentInnings) return [];
    
    return bowlingTeam.playingXI.filter((player: Player) => {
      // Can't bowl consecutive overs
      return player.id !== currentInnings.currentBowler;
    });
  }, [bowlingTeam, currentInnings]);

  // Loading state
  if (!currentInnings || !battingTeam || !bowlingTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-300">Loading match data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            {onNavigateHome && (
              <Button
                onClick={onNavigateHome}
                className="p-2 bg-slate-600/20 hover:bg-slate-600/30 min-h-[44px]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-lg sm:text-2xl font-bold text-gradient-aurora">
              Live Cricket Scoring
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {lastAction && (
              <Button
                onClick={handleUndo}
                className="flex items-center gap-1 sm:gap-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 px-3 py-2 min-h-[44px] text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Undo</span>
              </Button>
            )}
            
            <Button
              onClick={() => setShowEndMatchModal(true)}
              className="flex items-center gap-1 sm:gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 min-h-[44px] text-sm"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">End Match</span>
            </Button>
          </div>
        </div>

        {/* Main Content Grid - Mobile First Design */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Mobile: Scoring First, Desktop: Left Column - Scoreboard */}
          <div className="order-2 lg:order-1 lg:col-span-2 space-y-4 sm:space-y-6">
            <Scoreboard
              match={matchData}
              currentInnings={currentInnings}
              battingTeam={battingTeam}
              bowlingTeam={bowlingTeam}
              currentBatsmen={currentBatsmen}
              currentBowler={currentBowler}
            />

            {/* Quick Actions - Mobile Optimized */}
            <div className="flex gap-2 sm:gap-4">
              <Button
                onClick={rotateStrike}
                className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 min-h-[44px] text-sm"
              >
                <span className="hidden sm:inline">🔄 </span>Rotate Strike
              </Button>
              <Button
                onClick={() => setShowScorecard(true)}
                className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 min-h-[44px] text-sm"
              >
                <span className="hidden sm:inline">📊 </span>Scorecard
              </Button>
            </div>
          </div>

          {/* Mobile: First Priority, Desktop: Right Column - Scoring & Statistics */}
          <div className="order-1 lg:order-2 space-y-4 sm:space-y-6">
            <QuickScoring
              onScore={handleScoreUpdate}
              onWicket={handleWicketClick}
              onExtra={handleExtrasClick}
              freeHit={freeHit}
              disabled={isMatchComplete}
            />

            {/* Statistics - Hidden on mobile by default, can be toggled */}
            <div className="hidden sm:block">
              <MatchStatistics
                match={matchData}
                currentInnings={currentInnings}
                battingTeam={battingTeam}
                bowlingTeam={bowlingTeam}
                onShowScorecard={() => setShowScorecard(true)}
              />
            </div>
          </div>
        </div>

        {/* Animations */}
        {scoreAnimation && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-40">
            <div className="text-6xl font-bold text-white animate-pulse">
              +{lastAction?.runs || 0}
            </div>
          </div>
        )}

        {boundaryAnimation && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-40">
            <div className="text-8xl animate-bounce">
              {lastAction?.runs === 4 ? '🏏' : '🚀'}
            </div>
          </div>
        )}

        {/* Modals */}
        <WicketModal
          isOpen={showWicketModal}
          onClose={() => setShowWicketModal(false)}
          onConfirm={handleWicketConfirm}
          currentBatsmen={currentBatsmen}
        />

        <NewBatsmanModal
          isOpen={showNewBatsmanModal}
          onClose={() => setShowNewBatsmanModal(false)}
          onConfirm={handleNewBatsmanConfirm}
          availablePlayers={battingTeam?.playingXI || []}
          currentBatsmen={currentInnings.currentBatsmen}
          dismissedBatsmanId={dismissedBatsmanId}
        />

        <ExtrasModal
          isOpen={showExtrasModal}
          onClose={() => setShowExtrasModal(false)}
          onConfirm={handleExtrasConfirm}
          extraType={extrasModalType}
        />

        <ConfirmationDialog
          isOpen={showEndMatchModal}
          onClose={() => setShowEndMatchModal(false)}
          onConfirm={handleEndMatch}
          title="End Match"
          message="Are you sure you want to end this match? This action cannot be undone."
          confirmText="End Match"
          type="warning"
        />

        {/* Bowler Change Modal */}
        <Modal
          isOpen={showBowlerModal}
          onClose={() => setShowBowlerModal(false)}
          title="🏏 Change Bowler"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-slate-300 text-center">
              Over completed! Select the next bowler.
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableBowlers.map((bowler: Player) => (
                <Button
                  key={bowler.id}
                  onClick={() => setSelectedNewBowler(bowler.id)}
                  className={`w-full h-12 text-left px-4 ${
                    selectedNewBowler === bowler.id
                      ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                      : 'bg-slate-600/20 hover:bg-slate-600/30'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{bowler.name}</span>
                    <span className="text-xs text-slate-400">
                      {cricketUtils.formatOvers(bowler.bowlingStats.overs, bowler.bowlingStats.balls)} overs, 
                      {bowler.bowlingStats.runs} runs, {bowler.bowlingStats.wickets} wickets
                    </span>
                  </div>
                </Button>
              ))}
            </div>

            <Button
              onClick={handleBowlerChange}
              disabled={!selectedNewBowler}
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 disabled:opacity-50"
            >
              Confirm Bowler
            </Button>
          </div>
        </Modal>

        {/* Scorecard Modal - Placeholder */}
        <Modal
          isOpen={showScorecard}
          onClose={() => setShowScorecard(false)}
          title="📊 Full Scorecard"
          size="xl"
        >
          <div className="text-center text-slate-300">
            <p>Full scorecard component will be implemented here.</p>
            <p className="text-sm text-slate-400 mt-2">
              This will show detailed batting and bowling statistics for both teams.
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ProfessionalScoringInterfaceV4;