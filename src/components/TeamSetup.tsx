import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import GlassCard from './GlassCard';
import TeamManager from './TeamManager';
import PlayerBrowser from './PlayerBrowser';
import { Player, Team } from '@/types/cricket';
import { Plus, Users, Search, Zap, Crown, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TeamSetupProps {
  onTeamsReady: (team1: Team, team2: Team, matchOvers: number) => void;
}

export default function TeamSetup({ onTeamsReady }: TeamSetupProps) {
  const [team1, setTeam1] = useState<Partial<Team>>({ name: '', fullRoster: [] });
  const [team2, setTeam2] = useState<Partial<Team>>({ name: '', fullRoster: [] });
  const [currentTeam, setCurrentTeam] = useState<1 | 2>(1);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [showPlayingXIDialog, setShowPlayingXIDialog] = useState(false);
  const [showPlayerBrowser, setShowPlayerBrowser] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<Player['role']>('batsman');
  const [matchOvers, setMatchOvers] = useState<number>(20);
  const [teamSize, setTeamSize] = useState<number>(11);
  const [savedTeams, setSavedTeams] = useState<any[]>([]);
  const [loadingSavedTeams, setLoadingSavedTeams] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load saved teams from Firebase on component mount
  const loadSavedTeams = async () => {
    setLoadingSavedTeams(true);
    setLoadError(null);
    try {
      const { getDatabaseService } = await import('@/services/databaseService');
      const databaseService = getDatabaseService();
      const teams = await databaseService.fetchTeams();
      setSavedTeams(teams);
      console.log('Loaded saved teams from Firebase:', teams.length, 'teams');
    } catch (error) {
      console.error('Failed to load saved teams:', error);
      setLoadError('Failed to load teams. Please try again later.');
      setSavedTeams([]);
    } finally {
      setLoadingSavedTeams(false);
    }
  };

  useEffect(() => {
    loadSavedTeams();
  }, []);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      role: newPlayerRole,
      battingStats: {
        status: null,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
        isRetiredHurt: false
      },
      bowlingStats: {
        overs: 0,
        balls: 0,
        runs: 0,
        wickets: 0,

        economyRate: 0,
        wides: 0,
        noBalls: 0
      },
      fieldingStats: {
        catches: 0,
        runOuts: 0,
        stumpings: 0
      }
    };

    if (currentTeam === 1) {
      setTeam1(prev => ({
        ...prev,
        fullRoster: [...(prev.fullRoster || []), newPlayer]
      }));
    } else {
      setTeam2(prev => ({
        ...prev,
        fullRoster: [...(prev.fullRoster || []), newPlayer]
      }));
    }

    setNewPlayerName('');
    setShowPlayerDialog(false);
  };

  const removePlayer = (playerId: string, teamNum: 1 | 2) => {
    if (teamNum === 1) {
      setTeam1(prev => ({
        ...prev,
        fullRoster: prev.fullRoster?.filter(p => p.id !== playerId) || []
      }));
    } else {
      setTeam2(prev => ({
        ...prev,
        fullRoster: prev.fullRoster?.filter(p => p.id !== playerId) || []
      }));
    }
  };

  const selectPlayingXI = (teamNum: 1 | 2) => {
    setCurrentTeam(teamNum);
    setShowPlayingXIDialog(true);
  };

  const confirmPlayingXI = (selectedPlayers: Player[]) => {
    if (selectedPlayers.length !== teamSize) return;

    if (currentTeam === 1) {
      setTeam1(prev => ({ ...prev, playingXI: selectedPlayers }));
    } else {
      setTeam2(prev => ({ ...prev, playingXI: selectedPlayers }));
    }
    setShowPlayingXIDialog(false);
  };

  const canProceed = () => {
    const isValidOvers = matchOvers >= 1 && matchOvers <= 200;
    const isValidTeamSize = teamSize >= 1 && teamSize <= 200;
    const result = team1.name && team2.name && 
                      team1.playingXI?.length === teamSize &&
           team2.playingXI?.length === teamSize &&
           isValidOvers && isValidTeamSize;
    
    console.log('canProceed check:', {
      team1Name: team1.name,
      team2Name: team2.name,
      team1PlayingXI: team1.playingXI?.length,
      team2PlayingXI: team2.playingXI?.length,
      matchOvers: matchOvers,
      teamSize: teamSize,
      isValidOvers: isValidOvers,
      isValidTeamSize: isValidTeamSize,
      canProceed: result
    });
    
    return result;
  };

  const handleProceed = () => {
    console.log('handleProceed clicked');
    if (canProceed()) {
          console.log('Proceeding to match setup with', matchOvers, 'overs');
    onTeamsReady(
      { ...team1, id: '1' } as Team,
      { ...team2, id: '2' } as Team,
      matchOvers
    );
    } else {
      console.log('Cannot proceed - requirements not met');
    }
  };

  // Test Firebase functionality
  const testFirebaseSave = async () => {
    try {
      console.log('Testing Firebase save...');
      const { getDatabaseService } = await import('@/services/databaseService');
      const databaseService = getDatabaseService();
      
      const testTeam = {
        name: 'Firebase Test Team',
        fullRoster: samplePlayers.slice(0, 11),
        playingXI: samplePlayers.slice(0, 11)
      };
      
      const savedTeam = await databaseService.saveTeam(testTeam);
      console.log('Firebase save successful:', savedTeam);
      alert('Firebase save test successful! Check console for details.');
    } catch (error) {
      console.error('Firebase save failed:', error);
      alert('Firebase save failed. Check console for details.');
    }
  };

  const handleLoadTeam = (team: Team, teamNumber: 1 | 2) => {
    const loadedTeam = {
      ...team,
      playingXI: [], // Reset playing XI for new match
      fullRoster: team.fullRoster?.map(player => ({
        ...player,
        id: `${teamNumber}-${player.id}-${Date.now()}` // Ensure unique IDs
      })) || []
    };

    if (teamNumber === 1) {
      setTeam1(loadedTeam);
      toast.success(`Loaded ${team.name} as Team 1`);
    } else {
      setTeam2(loadedTeam);
      toast.success(`Loaded ${team.name} as Team 2`);
    }
  };

  const handleSelectPlayerFromBrowser = (player: Player) => {
    if (currentTeam === 1) {
      setTeam1(prev => ({
        ...prev,
        fullRoster: [...(prev.fullRoster || []), player]
      }));
    } else {
      setTeam2(prev => ({
        ...prev,
        fullRoster: [...(prev.fullRoster || []), player]
      }));
    }
  };

  const openPlayerBrowser = (teamNum: 1 | 2) => {
    setCurrentTeam(teamNum);
    setShowPlayerBrowser(true);
  };

  const getCurrentTeamPlayerIds = () => {
    const team = currentTeam === 1 ? team1 : team2;
    return team.fullRoster?.map(p => p.id) || [];
  };

  // Sample players for quick setup
  const createSamplePlayer = (id: string, name: string, role: Player['role']): Player => ({
    id,
    name,
    role,
    battingStats: {
      status: null,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      isOut: false,
      isRetiredHurt: false
    },
    bowlingStats: {
      overs: 0,
      balls: 0,
      runs: 0,
      wickets: 0,
      economyRate: 0,
      wides: 0,
      noBalls: 0
    },
    fieldingStats: {
      catches: 0,
      runOuts: 0,
      stumpings: 0
    }
  });

  const samplePlayers: Player[] = [
    createSamplePlayer('sample-1', 'Virat Kohli', 'batsman'),
    createSamplePlayer('sample-2', 'Rohit Sharma', 'batsman'),
    createSamplePlayer('sample-3', 'MS Dhoni', 'wicketkeeper'),
    createSamplePlayer('sample-4', 'Jasprit Bumrah', 'bowler'),
    createSamplePlayer('sample-5', 'Ravindra Jadeja', 'allrounder'),
    createSamplePlayer('sample-6', 'KL Rahul', 'batsman'),
    createSamplePlayer('sample-7', 'Hardik Pandya', 'allrounder'),
    createSamplePlayer('sample-8', 'Mohammed Shami', 'bowler'),
    createSamplePlayer('sample-9', 'Yuzvendra Chahal', 'bowler'),
    createSamplePlayer('sample-10', 'Shikhar Dhawan', 'batsman'),
    createSamplePlayer('sample-11', 'Rishabh Pant', 'wicketkeeper'),
    createSamplePlayer('sample-12', 'Bhuvneshwar Kumar', 'bowler'),
    createSamplePlayer('sample-13', 'Suryakumar Yadav', 'batsman'),
    createSamplePlayer('sample-14', 'Washington Sundar', 'allrounder'),
    createSamplePlayer('sample-15', 'Ishan Kishan', 'wicketkeeper')
  ];

  const addSamplePlayers = (teamNum: 1 | 2) => {
    const team = teamNum === 1 ? team1 : team2;
    const currentRoster = team.fullRoster || [];
    const playersNeeded = teamSize - currentRoster.length;
    
    if (playersNeeded <= 0) return;

    // Get existing player names to avoid duplicates
    const existingNames = currentRoster.map(p => p.name.toLowerCase());
    
    // Filter available sample players
    const availablePlayers = samplePlayers.filter(p => 
      !existingNames.includes(p.name.toLowerCase())
    );
    
    // Add the needed number of players
    const playersToAdd = availablePlayers.slice(0, playersNeeded).map(p => ({
      ...p,
      id: `${teamNum}-${p.id}-${Date.now()}`
    }));

    if (teamNum === 1) {
      setTeam1(prev => ({
        ...prev,
        fullRoster: [...currentRoster, ...playersToAdd]
      }));
    } else {
      setTeam2(prev => ({
        ...prev,
        fullRoster: [...currentRoster, ...playersToAdd]
      }));
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gradient-aurora mb-3 sm:mb-4">
          Team Setup
        </h2>
        <div className="readable-text inline-block">
          <p className="text-foreground text-sm sm:text-base">
            Configure your teams and select playing XI for the cosmic cricket battle
          </p>
        </div>
      </motion.div>

      {/* Match Setup Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        {/* Progress Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className={`p-4 glass-card border-glass-border/20 rounded-lg ${
            team1.name && team1.playingXI?.length === teamSize 
              ? 'border-green-500/30 bg-green-500/10' 
              : 'border-glass-border/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">Team 1</span>
              <div className="flex items-center space-x-2">
                {team1.name && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    Named
                  </span>
                )}
                {team1.playingXI?.length === teamSize && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    Playing XI ✓
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {team1.name || 'No name'} • {team1.fullRoster?.length || 0} players • 
                              {team1.playingXI?.length || 0}/{teamSize} Playing XI
            </div>
          </div>

          <div className={`p-4 glass-card border-glass-border/20 rounded-lg ${
            team2.name && team2.playingXI?.length === teamSize 
              ? 'border-green-500/30 bg-green-500/10' 
              : 'border-glass-border/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">Team 2</span>
              <div className="flex items-center space-x-2">
                {team2.name && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    Named
                  </span>
                )}
                {team2.playingXI?.length === teamSize && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    Playing XI ✓
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {team2.name || 'No name'} • {team2.fullRoster?.length || 0} players • 
                              {team2.playingXI?.length || 0}/{teamSize} Playing XI
            </div>
          </div>
        </div>

        {/* Match Configuration */}
        <div className="space-y-3 sm:space-y-4 max-w-md mx-auto">
          <div className="space-y-2">
            <Label htmlFor="match-overs" className="text-center block text-sm sm:text-base">
              Match Format (Overs per Innings)
            </Label>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMatchOvers(5)}
                className={`min-h-[44px] text-xs sm:text-sm ${matchOvers === 5 ? 'bg-primary/20 border-primary' : ''}`}
              >
                T5
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMatchOvers(10)}
                className={`min-h-[44px] text-xs sm:text-sm ${matchOvers === 10 ? 'bg-primary/20 border-primary' : ''}`}
              >
                T10
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMatchOvers(20)}
                className={`min-h-[44px] text-xs sm:text-sm ${matchOvers === 20 ? 'bg-primary/20 border-primary' : ''}`}
              >
                T20
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMatchOvers(50)}
                className={`min-h-[44px] text-xs sm:text-sm ${matchOvers === 50 ? 'bg-primary/20 border-primary' : ''}`}
              >
                ODI
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                id="match-overs"
                type="number"
                min="1"
                max="200"
                value={matchOvers === 0 ? '' : matchOvers}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setMatchOvers(0); // Allow empty state
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 1 && numValue <= 200) {
                      setMatchOvers(numValue);
                    }
                  }
                }}
                onKeyPress={(e) => {
                  // Only allow numbers
                  if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                    e.preventDefault();
                  }
                }}
                className="glass-card border-glass-border/20 text-center"
                placeholder="Enter overs (1-200)"
              />
              <span className="text-sm text-muted-foreground">overs</span>
            </div>
          </div>

          {/* Team Size Selection */}
          <div className="space-y-2">
            <Label htmlFor="team-size" className="text-center block">
              Team Size (Players per Team)
            </Label>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTeamSize(5)}
                className={teamSize === 5 ? 'bg-primary/20 border-primary' : ''}
              >
                5 Players
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTeamSize(7)}
                className={teamSize === 7 ? 'bg-primary/20 border-primary' : ''}
              >
                7 Players
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTeamSize(11)}
                className={teamSize === 11 ? 'bg-primary/20 border-primary' : ''}
              >
                11 Players
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                id="team-size"
                type="number"
                min="1"
                max="200"
                value={teamSize === 0 ? '' : teamSize}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setTeamSize(0); // Allow empty state
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 1 && numValue <= 200) {
                      setTeamSize(numValue);
                    }
                  }
                }}
                onKeyPress={(e) => {
                  // Only allow numbers
                  if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                    e.preventDefault();
                  }
                }}
                className="glass-card border-glass-border/20 text-center"
                placeholder="Enter team size (1-200)"
              />
              <span className="text-sm text-muted-foreground">players</span>
            </div>
          </div>
        </div>

        {/* Proceed Button */}
        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleProceed}
            disabled={!canProceed()}
            variant="cosmic"
            size="lg"
            className="px-8 py-3"
          >
            Start {matchOvers}-Over Match
          </Button>
          
          {/* Firebase Test Button */}
          <Button
            onClick={testFirebaseSave}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            🔥 Test Firebase Save
          </Button>
        </div>
        
        {!canProceed() && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Complete the following to start the match:
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              {!team1.name && <div>• Team 1 needs a name</div>}
              {team1.playingXI?.length !== teamSize && <div>• Team 1 needs Playing XI ({teamSize} players)</div>}
              {!team2.name && <div>• Team 2 needs a name</div>}
              {team2.playingXI?.length !== teamSize && <div>• Team 2 needs Playing XI ({teamSize} players)</div>}
            </div>
          </div>
        )}
      </motion.div>

      {/* Saved Teams from Firebase */}
      {savedTeams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-gradient-primary text-center">
            🔥 Saved Teams from Firebase ({savedTeams.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {savedTeams.slice(0, 6).map((team) => (
              <div
                key={team.id}
                className="p-3 glass-card border-glass-border/20 rounded-lg hover:border-primary/30 transition-all"
              >
                <div className="space-y-2">
                  <div className="font-medium text-sm">{team.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {team.fullRoster?.length || 0} players
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTeam1({
                          name: team.name,
                          fullRoster: team.fullRoster || [],
                          playingXI: team.playingXI || []
                        });
                      }}
                      className="text-xs flex-1"
                    >
                      Load as Team 1
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTeam2({
                          name: team.name,
                          fullRoster: team.fullRoster || [],
                          playingXI: team.playingXI || []
                        });
                      }}
                      className="text-xs flex-1"
                    >
                      Load as Team 2
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {savedTeams.length > 6 && (
            <p className="text-center text-xs text-muted-foreground">
              Showing 6 of {savedTeams.length} saved teams
            </p>
          )}
        </motion.div>
      )}

      {/* Loading and Error States */}
      {(loadingSavedTeams || loadError) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-2"
        >
          {loadingSavedTeams && (
            <>
              <div className="text-sm text-muted-foreground">Loading saved teams from Firebase...</div>
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
            </>
          )}
          {loadError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {loadError}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLoadError(null);
                  loadSavedTeams();
                }}
                className="ml-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Team 1 */}
        <GlassCard className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gradient-primary">Team 1</h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openPlayerBrowser(1)}
                className="min-h-[44px] text-xs sm:text-sm justify-start sm:justify-center"
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Players
              </Button>
              <Button
                variant="cosmic"
                size="sm"
                onClick={() => {
                  setCurrentTeam(1);
                  setShowPlayerDialog(true);
                }}
                className="min-h-[44px] text-xs sm:text-sm justify-start sm:justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>
          </div>

          {/* Team 1 Management */}
          <TeamManager
            currentTeam={team1}
            onLoadTeam={(team) => handleLoadTeam(team, 1)}
            teamNumber={1}
            teamSize={teamSize}
          />

          <div className="space-y-4">
            <div>
              <Label htmlFor="team1-name">Team Name</Label>
              <Input
                id="team1-name"
                value={team1.name || ''}
                onChange={(e) => setTeam1(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
                className="glass-card border-glass-border/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>
                  Squad ({team1.fullRoster?.length || 0} players)
                  {(team1.fullRoster?.length || 0) < teamSize && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Need {teamSize - (team1.fullRoster?.length || 0)} more for Playing XI)
                    </span>
                  )}
                </Label>
                <div className="flex space-x-2">
                  {(team1.fullRoster?.length || 0) >= teamSize ? (
                    <Button
                      variant="score"
                      size="sm"
                      onClick={() => selectPlayingXI(1)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {team1.playingXI?.length === teamSize ? 'Edit Playing XI' : 'Select Playing XI'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="opacity-50"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Need {teamSize - (team1.fullRoster?.length || 0)} more players
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSamplePlayers(1)}
                        className="text-xs"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Quick Add {teamSize - (team1.fullRoster?.length || 0)}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {team1.fullRoster?.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 glass-card border-glass-border/10"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {player.role}
                      </span>
                      {team1.playingXI?.some(p => p.id === player.id) && (
                        <Crown className="h-3 w-3 text-accent" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(player.id, 1)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {team1.playingXI?.length === teamSize && (
                <div className="mt-2 p-2 bg-accent/20 rounded text-accent text-sm">
                  ✓ Playing XI selected ({team1.playingXI.length}/{teamSize})
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Team 2 */}
        <GlassCard className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gradient-primary">Team 2</h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openPlayerBrowser(2)}
                className="min-h-[44px] text-xs sm:text-sm justify-start sm:justify-center"
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Players
              </Button>
              <Button
                variant="cosmic"
                size="sm"
                onClick={() => {
                  setCurrentTeam(2);
                  setShowPlayerDialog(true);
                }}
                className="min-h-[44px] text-xs sm:text-sm justify-start sm:justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>
          </div>

          {/* Team 2 Management */}
          <TeamManager
            currentTeam={team2}
            onLoadTeam={(team) => handleLoadTeam(team, 2)}
            teamNumber={2}
            teamSize={teamSize}
          />

          <div className="space-y-4">
            <div>
              <Label htmlFor="team2-name">Team Name</Label>
              <Input
                id="team2-name"
                value={team2.name || ''}
                onChange={(e) => setTeam2(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
                className="glass-card border-glass-border/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>
                  Squad ({team2.fullRoster?.length || 0} players)
                  {(team2.fullRoster?.length || 0) < teamSize && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Need {teamSize - (team2.fullRoster?.length || 0)} more for Playing XI)
                    </span>
                  )}
                </Label>
                <div className="flex space-x-2">
                  {(team2.fullRoster?.length || 0) >= teamSize ? (
                    <Button
                      variant="score"
                      size="sm"
                      onClick={() => {
                        console.log('Team 2 Select Playing XI clicked', { 
                          team2RosterLength: team2.fullRoster?.length,
                          team2PlayingXI: team2.playingXI?.length 
                        });
                        selectPlayingXI(2);
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {team2.playingXI?.length === teamSize ? 'Edit Playing XI' : 'Select Playing XI'}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="opacity-50"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Need {teamSize - (team2.fullRoster?.length || 0)} more players
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log('Team 2 Quick Add clicked', { 
                            currentRoster: team2.fullRoster?.length || 0,
                            playersNeeded: teamSize - (team2.fullRoster?.length || 0)
                          });
                          addSamplePlayers(2);
                        }}
                        className="text-xs"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Quick Add {teamSize - (team2.fullRoster?.length || 0)}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {team2.fullRoster?.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 glass-card border-glass-border/10"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {player.role}
                      </span>
                      {team2.playingXI?.some(p => p.id === player.id) && (
                        <Crown className="h-3 w-3 text-accent" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(player.id, 2)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {team2.playingXI?.length === teamSize && (
                <div className="mt-2 p-2 bg-accent/20 rounded text-accent text-sm">
                  ✓ Playing XI selected ({team2.playingXI.length}/{teamSize})
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Proceed Button */}
      <div className="text-center">
        <Button
          variant="cosmic"
          size="lg"
          onClick={handleProceed}
          disabled={!canProceed()}
          className="w-full sm:w-auto px-8 sm:px-12 min-h-[52px]"
        >
          <Shield className="h-5 w-5 mr-2" />
          Proceed to Toss
        </Button>
      </div>

      {/* Add Player Dialog */}
      <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
        <DialogContent className="glass-card border-glass-border/30">
          <DialogHeader>
            <DialogTitle className="text-gradient-primary">Add New Player</DialogTitle>
            <DialogDescription>
              Add a new player to the team roster with their role and details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="player-name">Player Name</Label>
              <Input
                id="player-name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="glass-card border-glass-border/20"
              />
            </div>
            <div>
              <Label htmlFor="player-role">Role</Label>
              <select
                id="player-role"
                value={newPlayerRole}
                onChange={(e) => setNewPlayerRole(e.target.value as Player['role'])}
                className="w-full p-2 glass-card border-glass-border/20 rounded-md bg-background text-foreground"
              >
                <option value="batsman">Batsman</option>
                <option value="bowler">Bowler</option>
                <option value="allrounder">All-rounder</option>
                <option value="wicketkeeper">Wicket Keeper</option>
              </select>
            </div>
            <Button onClick={addPlayer} variant="cosmic" className="w-full">
              Add Player
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Playing XI Selection Dialog */}
      <PlayingXIDialog
        open={showPlayingXIDialog}
        onClose={() => setShowPlayingXIDialog(false)}
        team={currentTeam === 1 ? team1 : team2}
        onConfirm={confirmPlayingXI}
        teamSize={teamSize}
      />

      {/* Player Browser Dialog */}
      <PlayerBrowser
        open={showPlayerBrowser}
        onClose={() => setShowPlayerBrowser(false)}
        onSelectPlayer={handleSelectPlayerFromBrowser}
        excludePlayerIds={getCurrentTeamPlayerIds()}
      />
    </div>
  );
}

interface PlayingXIDialogProps {
  open: boolean;
  onClose: () => void;
  team: Partial<Team>;
  onConfirm: (players: Player[]) => void;
  teamSize: number;
}

function PlayingXIDialog({ open, onClose, team, onConfirm, teamSize }: PlayingXIDialogProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  // Reset selected players when dialog opens or team changes
  useEffect(() => {
    if (open) {
      setSelectedPlayers(team.playingXI || []);
    }
  }, [open, team.playingXI]);

  const togglePlayer = (player: Player) => {
    console.log('Toggle player clicked:', player.name);
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      console.log('Player selected state:', isSelected, 'Current selection:', prev.length);
      
      if (isSelected) {
        const newSelection = prev.filter(p => p.id !== player.id);
        console.log('Deselecting player, new count:', newSelection.length);
        return newSelection;
      } else if (prev.length < teamSize) {
        const newSelection = [...prev, player];
        console.log('Selecting player, new count:', newSelection.length);
        return newSelection;
      }
      console.log('Cannot select more players, already at limit');
      return prev;
    });
  };

  const handleConfirm = () => {
    if (selectedPlayers.length === teamSize) {
      onConfirm(selectedPlayers);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-glass-border/30 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gradient-primary">
            Select Playing XI for {team.name}
          </DialogTitle>
          <DialogDescription>
                            Choose exactly {teamSize} players from the squad to form the playing XI for this match.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Selected: {selectedPlayers.length}/{teamSize} players
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {team.fullRoster?.map((player) => {
              const isSelected = selectedPlayers.some(p => p.id === player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player)}
                  className={`p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'glass-card border-glass-border/20 hover:border-glass-border/40'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs opacity-70 capitalize">{player.role}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleConfirm}
            variant="cosmic"
            className="w-full"
                          disabled={selectedPlayers.length !== teamSize}
          >
                            Confirm Playing XI ({selectedPlayers.length}/{teamSize})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
