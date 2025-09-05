import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import GlassCard from './GlassCard';
import TeamSetup from './TeamSetup';
import TossSetup from './TossSetup';
import ProfessionalScoringInterfaceV3 from './ProfessionalScoringInterfaceV3';
import { Match, Team, Innings } from '@/types/cricket';
import { ArrowLeft, Play, Users, Coins, Target } from 'lucide-react';
import { getDatabaseService } from '@/services/databaseService';
import { initializeFirebaseDatabase } from '@/config/firebase';

type AppState = 'home' | 'teamSetup' | 'toss' | 'preMatch' | 'live' | 'complete';

export default function ProfessionalCricketApp() {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [matchOvers, setMatchOvers] = useState<number>(20);
  const [isLoadingMatch, setIsLoadingMatch] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  // FIREBASE-ONLY PERSISTENCE: Initialize Firebase and restore match state on page refresh
  useEffect(() => {
    const initializeAndRestoreMatch = async () => {
      try {
        // Initialize Firebase database service
        console.log('FIREBASE: Initializing Firebase database...');
        const initialized = initializeFirebaseDatabase();
        
        if (!initialized) {
          console.error('FIREBASE: Failed to initialize Firebase database');
          setIsLoadingMatch(false);
          return;
        }
        
        setFirebaseInitialized(true);
        console.log('FIREBASE: Database initialized successfully');
        
        // Look for any active (incomplete) match in Firebase
        const databaseService = getDatabaseService();
        console.log('FIREBASE: Fetching all matches to find active match...');
        
        const matches = await databaseService.fetchAllMatches();
        console.log('FIREBASE: Fetched', matches.length, 'total matches');
        
        // Find the most recent active match (incomplete and live)
        const activeMatch = matches
          .filter((m: Match) => {
            const isNotComplete = !m.isComplete;
            const isLive = m.isLive;
            console.log('FIREBASE: Checking match:', {
              id: m.id,
              isComplete: m.isComplete,
              isLive: m.isLive,
              shouldRestore: isNotComplete && isLive
            });
            return isNotComplete && isLive;
          })
          .sort((a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (activeMatch) {
          // Double-check the match is truly active before restoring
          if (!activeMatch.isComplete && activeMatch.isLive) {
            console.log('FIREBASE: Found active match, restoring state:', {
              id: activeMatch.id,
              isLive: activeMatch.isLive,
              isComplete: activeMatch.isComplete,
              team1: activeMatch.team1.name,
              team2: activeMatch.team2.name,
              currentInnings: activeMatch.currentInnings
            });
            
            setCurrentMatch(activeMatch);
            setTeam1(activeMatch.team1);
            setTeam2(activeMatch.team2);
            setMatchOvers(activeMatch.totalOvers);
            
            // Always go to live state for active matches
            setAppState('live');
          } else {
            console.log('FIREBASE: Match found but not truly active, staying on home screen:', {
              isComplete: activeMatch.isComplete,
              isLive: activeMatch.isLive
            });
          }
        } else {
          console.log('FIREBASE: No active match found, staying on home screen');
        }
        
      } catch (error) {
        console.error('FIREBASE: Error during initialization or match restoration:', error);
      } finally {
        setIsLoadingMatch(false);
      }
    };

    initializeAndRestoreMatch();
  }, []);

  const startNewMatch = () => {
    setAppState('teamSetup');
  };

  const handleTeamsReady = (t1: Team, t2: Team, matchOvers: number) => {
    setTeam1(t1);
    setTeam2(t2);
    setMatchOvers(matchOvers);
    setAppState('toss');
  };

  const handleTossComplete = (tossWinner: string, decision: 'bat' | 'bowl') => {
    if (!team1 || !team2) return;

    // Determine batting and bowling teams based on toss decision
    const battingTeam = decision === 'bat' ? 
      (tossWinner === team1.name ? team1 : team2) :
      (tossWinner === team1.name ? team2 : team1);

    const bowlingTeam = decision === 'bowl' ?
      (tossWinner === team1.name ? team1 : team2) :
      (tossWinner === team1.name ? team2 : team1);

    // Create initial match object
    const match: Match = {
      id: Date.now().toString(),
      team1,
      team2,
      totalOvers: matchOvers, // Use custom overs from team setup
      tossWinner,
      tossDecision: decision,
      battingFirst: battingTeam.name,
      currentInnings: 1,
      innings: {
        first: createNewInnings(1, battingTeam.id, bowlingTeam.id)
      },
      isLive: false,
      isComplete: false,
      matchType: 'T20',
      date: new Date()
    };

    console.log('Match setup:', {
      tossWinner,
      decision,
      battingTeam: battingTeam.name,
      bowlingTeam: bowlingTeam.name
    });

    setCurrentMatch(match);
    setAppState('preMatch');
  };

  const createNewInnings = (number: 1 | 2, battingTeamId: string, bowlingTeamId: string): Innings => {
    return {
      number,
      battingTeam: battingTeamId,
      bowlingTeam: bowlingTeamId,
      score: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      extras: 0,
      isComplete: false,
      currentBatsmen: {
        striker: '', // Will be set in pre-match setup
        nonStriker: ''
      },
      currentBowler: '', // Will be set in pre-match setup
      overHistory: [],
      ballHistory: [],
      partnerships: [],
      commentary: []
    };
  };

  const startMatch = () => {
    if (currentMatch) {
      const updatedMatch = { ...currentMatch, isLive: true };
      setCurrentMatch(updatedMatch);
      setAppState('live');
      
      // FIREBASE-ONLY: Save match to Firebase when starting
      handleMatchUpdate(updatedMatch);
    }
  };

  const handleMatchUpdate = async (updatedMatch: Match) => {
    setCurrentMatch(updatedMatch);
    
    // FIREBASE-ONLY: Save match state exclusively to Firebase
    if (!firebaseInitialized) {
      console.error('FIREBASE: Cannot save match - Firebase not initialized');
      return;
    }
    
    try {
      const databaseService = getDatabaseService();
      await databaseService.saveMatch(updatedMatch);
      console.log('FIREBASE: Match saved successfully:', updatedMatch.id);
      
      // Don't auto-navigate to basic complete screen - let the comprehensive scorecard modal handle match completion
      // The detailed scorecard in ProfessionalScoringInterfaceV3 provides much better UX
      // if (updatedMatch.isComplete) {
      //   setAppState('complete');
      // }
    } catch (error) {
      console.error('FIREBASE: Failed to save match:', error);
      // TODO: Add user notification for save failures
    }
  };

  const goBack = () => {
    switch (appState) {
      case 'teamSetup':
        setAppState('home');
        break;
      case 'toss':
        setAppState('teamSetup');
        break;
      case 'preMatch':
        setAppState('toss');
        break;
      case 'live':
        setAppState('preMatch');
        break;
      default:
        setAppState('home');
    }
  };

  const resetApp = () => {
    setAppState('home');
    setCurrentMatch(null);
    setTeam1(null);
    setTeam2(null);
  };

  const handleResumeMatch = (match: Match) => {
    setCurrentMatch(match);
    setTeam1(match.team1);
    setTeam2(match.team2);
    setAppState('live');
    // Ensure match state is properly updated
    handleMatchUpdate(match);
  };

  // FIREBASE-ONLY: Show loading screen while initializing Firebase and restoring match state
  if (isLoadingMatch) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="text-2xl font-bold text-gradient-aurora">
            Connecting to Firebase...
          </div>
          <div className="text-slate-400">
            Initializing database and checking for active matches
          </div>
          <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Navigation Header */}
      {appState !== 'home' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                ['teamSetup', 'toss', 'preMatch', 'live', 'complete'].includes(appState) 
                  ? 'bg-accent' : 'bg-muted'
              }`} />
              <div className={`w-3 h-3 rounded-full ${
                ['toss', 'preMatch', 'live', 'complete'].includes(appState) 
                  ? 'bg-accent' : 'bg-muted'
              }`} />
              <div className={`w-3 h-3 rounded-full ${
                ['preMatch', 'live', 'complete'].includes(appState) 
                  ? 'bg-accent' : 'bg-muted'
              }`} />
              <div className={`w-3 h-3 rounded-full ${
                ['live', 'complete'].includes(appState) 
                  ? 'bg-accent' : 'bg-muted'
              }`} />
            </div>

            <Button
              variant="ghost"
              onClick={resetApp}
              className="text-muted-foreground"
            >
              Start Over
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <AnimatePresence mode="wait">
          {appState === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <HomeScreen onStartMatch={startNewMatch} onResumeMatch={handleResumeMatch} />
            </motion.div>
          )}

          {appState === 'teamSetup' && (
            <motion.div
              key="teamSetup"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <TeamSetup onTeamsReady={handleTeamsReady} />
            </motion.div>
          )}

          {appState === 'toss' && team1 && team2 && (
            <motion.div
              key="toss"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <TossSetup 
                team1={team1} 
                team2={team2} 
                onTossComplete={handleTossComplete} 
              />
            </motion.div>
          )}

          {appState === 'preMatch' && currentMatch && (
            <motion.div
              key="preMatch"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <PreMatchSetup 
                match={currentMatch} 
                onMatchStart={startMatch}
                onMatchUpdate={handleMatchUpdate}
              />
            </motion.div>
          )}

          {appState === 'live' && currentMatch && (
            <motion.div
              key="live"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <ProfessionalScoringInterfaceV3 
                matchData={currentMatch} 
                setMatchData={setCurrentMatch}
                onScoreUpdate={handleMatchUpdate}
                onNavigateHome={() => {
                  setCurrentMatch(null);
                  setAppState('home');
                }}
              />
            </motion.div>
          )}

          {appState === 'complete' && currentMatch && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <MatchComplete match={currentMatch} onNewMatch={resetApp} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface HomeScreenProps {
  onStartMatch: () => void;
  onResumeMatch: (match: Match) => void;
}

function HomeScreen({ onStartMatch, onResumeMatch }: HomeScreenProps) {
  const [savedMatches, setSavedMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null);

  useEffect(() => {
    // Fetch all matches (both paused and finished) from Firebase
    const checkForMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const databaseService = getDatabaseService();
        const matches = await databaseService.fetchAllMatches();
        setSavedMatches(matches);
      } catch (error) {
        console.error('Error loading saved matches:', error);
        setError('Failed to check for saved matches');
      } finally {
        setIsLoading(false);
      }
    };

    checkForMatches();
  }, []);

  return (
    <div className="text-center py-16 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-6xl font-bold text-gradient-aurora mb-6">
          Professional Cricket
        </h1>
        <div className="readable-text max-w-3xl mx-auto">
          <p className="text-foreground text-xl font-medium">
            Experience the ultimate cricket scoring system with comprehensive player management, 
            advanced statistics, and professional-grade match analysis in a cosmic digital arena.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
      >
        <GlassCard hover className="p-6 text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Team Management</h3>
          <p className="text-sm text-muted-foreground">
            Full roster management with playing XI selection and player roles
          </p>
        </GlassCard>

        <GlassCard hover className="p-6 text-center">
          <Target className="h-12 w-12 text-accent mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Advanced Scoring</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive scoring with all extras, wickets, and match scenarios
          </p>
        </GlassCard>

        <GlassCard hover className="p-6 text-center">
          <Coins className="h-12 w-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Professional Stats</h3>
          <p className="text-sm text-muted-foreground">
            Detailed player statistics, match analysis, and performance tracking
          </p>
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="space-y-4"
      >
        <Button
          variant="cosmic"
          size="lg"
          onClick={onStartMatch}
          className="px-12 py-6 text-xl"
        >
          <Play className="mr-3 h-6 w-6" />
          Start New Match
        </Button>

        {/* Match History Section - Show paused and finished matches from Firebase */}
        {(isLoading || savedMatches.length > 0 || error) && (
          <div className="space-y-6">
            {/* Paused Matches Section */}
            <GlassCard className="p-6 max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold mb-4">🏏 Paused Matches</h3>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Checking for saved matches...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-2">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="mx-auto"
                  >
                    Retry
                  </Button>
                </div>
              ) : savedMatches.length > 0 ? (
                (() => {
                  const pausedMatches = savedMatches.filter(match => !match.isComplete);
                  return pausedMatches.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Found {pausedMatches.length} paused match{pausedMatches.length > 1 ? 'es' : ''} that can be resumed:
                      </p>
                      
                      <div className="grid gap-4">
                        {pausedMatches.map((match) => (
                          <div key={match.id} className="border border-slate-700/50 rounded-lg p-4 bg-slate-800/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="font-semibold text-lg">
                                  {match.team1.name} vs {match.team2.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">Score:</span>{' '}
                                  {match.currentInnings === 1 ? (
                                    <>{match.innings.first?.score || 0}/{match.innings.first?.wickets || 0} ({match.innings.first?.overs || 0}.{match.innings.first?.balls || 0} ov)</>
                                  ) : (
                                    <>{match.innings.second?.score || 0}/{match.innings.second?.wickets || 0} ({match.innings.second?.overs || 0}.{match.innings.second?.balls || 0} ov)</>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">Innings:</span> {match.currentInnings}/2
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">Match Type:</span> T{match.totalOvers}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">Last Updated:</span>{' '}
                                  {new Date(match.date).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">Status:</span>{' '}
                                  <span className="text-yellow-400">
                                    {match.currentInnings === 1 ? 'First Innings' : 'Second Innings'} - In Progress
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-3">
                              <Button
                                variant="cosmic"
                                onClick={() => onResumeMatch(match)}
                                className="w-full"
                              >
                                Resume This Match
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No paused matches found.</p>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No paused matches found.</p>
                </div>
              )}
            </GlassCard>

            {/* Finished Matches Section */}
            {(() => {
              const finishedMatches = savedMatches.filter(match => match.isComplete);
              return finishedMatches.length > 0 ? (
                <GlassCard className="p-6 max-w-4xl mx-auto">
                  <h3 className="text-xl font-semibold mb-4">🏆 Finished Matches</h3>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Found {finishedMatches.length} completed match{finishedMatches.length > 1 ? 'es' : ''}:
                    </p>
                    
                    <div className="grid gap-4">
                      {finishedMatches.map((match) => (
                        <div key={match.id} className="border border-slate-700/50 rounded-lg p-4 bg-slate-800/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="font-semibold text-lg">
                                {match.team1.name} vs {match.team2.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Final Score:</span>
                                <div className="mt-1 space-y-1">
                                  <div>{match.team1.name}: {match.innings.first?.score || 0}/{match.innings.first?.wickets || 0} ({match.innings.first?.overs || 0}.{match.innings.first?.balls || 0} ov)</div>
                                  <div>{match.team2.name}: {match.innings.second?.score || 0}/{match.innings.second?.wickets || 0} ({match.innings.second?.overs || 0}.{match.innings.second?.balls || 0} ov)</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Match Type:</span> T{match.totalOvers}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Completed:</span>{' '}
                                {new Date(match.date).toLocaleString()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Result:</span>{' '}
                                <span className="text-green-400 font-medium">
                                  {match.result || 'Match Complete'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedMatchForDetails(match)}
                              className="w-full"
                            >
                              View Match Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              ) : null;
            })()}
          </div>
        )}

        {/* Match Details Modal for Finished Matches */}
        {selectedMatchForDetails && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gradient-aurora">Match Scorecard</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMatchForDetails(null)}
                  className="px-6"
                >
                  Close Scorecard
                </Button>
              </div>

              {/* Match Summary */}
              <div className="mb-8">
                <GlassCard className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gradient-primary mb-2">
                      {selectedMatchForDetails.team1.name} vs {selectedMatchForDetails.team2.name}
                    </h3>
                    <div className="text-lg text-muted-foreground">
                      T{selectedMatchForDetails.totalOvers} Match • {new Date(selectedMatchForDetails.date).toLocaleDateString()}
                    </div>
                    <div className="text-xl font-semibold text-green-400 mt-2">
                      {selectedMatchForDetails.result || 'Match Complete'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Innings */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gradient-primary">First Innings</h4>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-xl font-bold">
                          {selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team1.name : selectedMatchForDetails.team2.name}
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {selectedMatchForDetails.innings.first?.score || 0}/{selectedMatchForDetails.innings.first?.wickets || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ({selectedMatchForDetails.innings.first?.overs || 0}.{selectedMatchForDetails.innings.first?.balls || 0} overs)
                        </div>
                      </div>
                    </div>

                    {/* Second Innings */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gradient-primary">Second Innings</h4>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-xl font-bold">
                          {selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team2.name : selectedMatchForDetails.team1.name}
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {selectedMatchForDetails.innings.second?.score || 0}/{selectedMatchForDetails.innings.second?.wickets || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ({selectedMatchForDetails.innings.second?.overs || 0}.{selectedMatchForDetails.innings.second?.balls || 0} overs)
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Detailed Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* First Innings Batting */}
                <div>
                  <h4 className="text-xl font-semibold text-gradient-primary mb-4">
                    {selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team1.name : selectedMatchForDetails.team2.name} Batting
                  </h4>
                  <GlassCard className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2">Batsman</th>
                            <th className="text-center py-2">R</th>
                            <th className="text-center py-2">B</th>
                            <th className="text-center py-2">4s</th>
                            <th className="text-center py-2">6s</th>
                            <th className="text-center py-2">SR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const battingTeam = selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team1 : selectedMatchForDetails.team2;
                            return battingTeam.playingXI
                              .filter(player => player.battingStats.ballsFaced > 0 || player.battingStats.runs > 0)
                              .map((player) => (
                                <tr key={player.id} className="border-b border-slate-800">
                                  <td className="py-2 font-medium">{player.name}</td>
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
                  </GlassCard>
                </div>

                {/* First Innings Bowling */}
                <div>
                  <h4 className="text-xl font-semibold text-gradient-primary mb-4">
                    {selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team2.name : selectedMatchForDetails.team1.name} Bowling
                  </h4>
                  <GlassCard className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2">Bowler</th>
                            <th className="text-center py-2">O</th>
                            <th className="text-center py-2">R</th>
                            <th className="text-center py-2">W</th>
                            <th className="text-center py-2">Econ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const bowlingTeam = selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team2 : selectedMatchForDetails.team1;
                            return bowlingTeam.playingXI
                              .filter(player => player.bowlingStats.overs > 0 || player.bowlingStats.runs > 0)
                              .map((player) => (
                                <tr key={player.id} className="border-b border-slate-800">
                                  <td className="py-2 font-medium">{player.name}</td>
                                  <td className="text-center py-2">{player.bowlingStats.overs}</td>
                                  <td className="text-center py-2">{player.bowlingStats.runs}</td>
                                  <td className="text-center py-2">{player.bowlingStats.wickets}</td>
                                  <td className="text-center py-2">{player.bowlingStats.overs > 0 ? (player.bowlingStats.runs / player.bowlingStats.overs).toFixed(1) : '0.0'}</td>
                                </tr>
                              ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                </div>

                {/* Second Innings Batting */}
                {selectedMatchForDetails.innings.second && (
                  <div>
                    <h4 className="text-xl font-semibold text-gradient-primary mb-4">
                      {selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team2.name : selectedMatchForDetails.team1.name} Batting
                    </h4>
                    <GlassCard className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left py-2">Batsman</th>
                              <th className="text-center py-2">R</th>
                              <th className="text-center py-2">B</th>
                              <th className="text-center py-2">4s</th>
                              <th className="text-center py-2">6s</th>
                              <th className="text-center py-2">SR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const battingTeam = selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team2 : selectedMatchForDetails.team1;
                              return battingTeam.playingXI
                                .filter(player => player.battingStats.ballsFaced > 0 || player.battingStats.runs > 0)
                                .map((player) => (
                                  <tr key={player.id} className="border-b border-slate-800">
                                    <td className="py-2 font-medium">{player.name}</td>
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
                    </GlassCard>
                  </div>
                )}

                {/* Second Innings Bowling */}
                {selectedMatchForDetails.innings.second && (
                  <div>
                    <h4 className="text-xl font-semibold text-gradient-primary mb-4">
                      {selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team1.name : selectedMatchForDetails.team2.name} Bowling
                    </h4>
                    <GlassCard className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              <th className="text-left py-2">Bowler</th>
                              <th className="text-center py-2">O</th>
                              <th className="text-center py-2">R</th>
                              <th className="text-center py-2">W</th>
                              <th className="text-center py-2">Econ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const bowlingTeam = selectedMatchForDetails.battingFirst === selectedMatchForDetails.team1.name ? selectedMatchForDetails.team1 : selectedMatchForDetails.team2;
                              return bowlingTeam.playingXI
                                .filter(player => player.bowlingStats.overs > 0 || player.bowlingStats.runs > 0)
                                .map((player) => (
                                  <tr key={player.id} className="border-b border-slate-800">
                                    <td className="py-2 font-medium">{player.name}</td>
                                    <td className="text-center py-2">{player.bowlingStats.overs}</td>
                                    <td className="text-center py-2">{player.bowlingStats.runs}</td>
                                    <td className="text-center py-2">{player.bowlingStats.wickets}</td>
                                    <td className="text-center py-2">{player.bowlingStats.overs > 0 ? (player.bowlingStats.runs / player.bowlingStats.overs).toFixed(1) : '0.0'}</td>
                                  </tr>
                                ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </GlassCard>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface PreMatchSetupProps {
  match: Match;
  onMatchStart: () => void;
  onMatchUpdate: (match: Match) => void;
}

function PreMatchSetup({ match, onMatchStart, onMatchUpdate }: PreMatchSetupProps) {
  const [openingBatsmen, setOpeningBatsmen] = useState<{ striker: string; nonStriker: string }>({
    striker: '',
    nonStriker: ''
  });
  const [openingBowler, setOpeningBowler] = useState<string>('');

  // Get batting and bowling teams based on toss result
  const battingTeam = match.battingFirst === match.team1.name ? match.team1 : match.team2;
  const bowlingTeam = match.battingFirst === match.team1.name ? match.team2 : match.team1;

  console.log('PreMatchSetup teams:', {
    battingTeam: battingTeam.name,
    bowlingTeam: bowlingTeam.name,
    battingFirst: match.battingFirst,
    team1: match.team1.name,
    team2: match.team2.name
  });

  const canStart = openingBatsmen.striker && openingBatsmen.nonStriker && openingBowler;

  const handleStart = () => {
    if (!canStart) return;

    const updatedMatch = { ...match };
    if (updatedMatch.innings.first) {
      updatedMatch.innings.first.currentBatsmen = openingBatsmen;
      updatedMatch.innings.first.currentBowler = openingBowler;
    }

    onMatchUpdate(updatedMatch);
    onMatchStart();
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gradient-aurora mb-4">
          Pre-Match Setup
        </h2>
        <div className="readable-text inline-block">
          <p className="text-foreground">
            Select opening batsmen and bowler to begin the cosmic cricket battle
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Opening Batsmen Selection */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gradient-primary">
            Opening Batsmen - {battingTeam.name}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Striker</label>
              <select
                value={openingBatsmen.striker}
                onChange={(e) => setOpeningBatsmen(prev => ({ ...prev, striker: e.target.value }))}
                className="w-full p-3 glass-card border-glass-border/20 rounded-md bg-background text-foreground"
              >
                <option value="">Select striker</option>
                {battingTeam.playingXI.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Non-Striker</label>
              <select
                value={openingBatsmen.nonStriker}
                onChange={(e) => setOpeningBatsmen(prev => ({ ...prev, nonStriker: e.target.value }))}
                className="w-full p-3 glass-card border-glass-border/20 rounded-md bg-background text-foreground"
              >
                <option value="">Select non-striker</option>
                {battingTeam.playingXI
                  .filter(player => player.id !== openingBatsmen.striker)
                  .map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Opening Bowler Selection */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gradient-primary">
            Opening Bowler - {bowlingTeam.name}
          </h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select Bowler</label>
            <select
              value={openingBowler}
              onChange={(e) => setOpeningBowler(e.target.value)}
              className="w-full p-3 glass-card border-glass-border/20 rounded-md bg-background text-foreground"
            >
              <option value="">Select opening bowler</option>
              {/* Show bowlers and all-rounders first, then rest of the team */}
              <optgroup label="Bowlers & All-rounders">
                {bowlingTeam.playingXI
                  .filter(player => player.role === 'bowler' || player.role === 'allrounder')
                  .map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Other Players">
                {bowlingTeam.playingXI
                  .filter(player => player.role !== 'bowler' && player.role !== 'allrounder')
                  .map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.role})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div className="mt-6 p-4 glass-card border-glass-border/10">
            <h4 className="font-semibold mb-2">Match Details</h4>
            <div className="space-y-1 text-sm">
              <div>Toss: {match.tossWinner} (chose to {match.tossDecision})</div>
              <div>Batting First: {battingTeam.name}</div>
              <div>Overs: {match.totalOvers}</div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="text-center">
        <Button
          variant="cosmic"
          size="lg"
          onClick={handleStart}
          disabled={!canStart}
          className="px-12"
        >
          <Play className="h-5 w-5 mr-2" />
          Start Match
        </Button>
      </div>
    </div>
  );
}

interface MatchCompleteProps {
  match: Match;
  onNewMatch: () => void;
}

function MatchComplete({ match, onNewMatch }: MatchCompleteProps) {
  return (
    <div className="text-center py-16 space-y-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-bold text-gradient-aurora mb-6">
          Match Complete! 🏆
        </h1>
        <GlassCard glow className="max-w-2xl mx-auto p-8">
          <div className="text-2xl font-semibold text-gradient-primary mb-4">
            {match.result}
          </div>
          <div className="space-y-2 text-lg">
            <div>{match.team1.name}: {match.innings.first?.score}/{match.innings.first?.wickets}</div>
            <div>{match.team2.name}: {match.innings.second?.score}/{match.innings.second?.wickets}</div>
          </div>
        </GlassCard>
      </motion.div>

      <Button
        variant="cosmic"
        size="lg"
        onClick={onNewMatch}
        className="px-12"
      >
        Start New Match
      </Button>
    </div>
  );
}
