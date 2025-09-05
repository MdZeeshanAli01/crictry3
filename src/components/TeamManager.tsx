import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import GlassCard from './GlassCard';
import { useTeamStorage } from '@/hooks/useTeamStorage';
import { Team } from '@/types/cricket';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, Upload, Trash2, Copy, Users, Crown, Shield, 
  Calendar, Clock, Download 
} from 'lucide-react';

interface TeamManagerProps {
  currentTeam: Partial<Team>;
  onLoadTeam: (team: Team) => void;
  onSaveComplete?: () => void;
  teamNumber: 1 | 2;
  teamSize: number;
}

export default function TeamManager({ currentTeam, onLoadTeam, onSaveComplete, teamNumber, teamSize }: TeamManagerProps) {
  const { savedTeams, saveTeam, loadTeam, deleteTeam, duplicateTeam, getTeamStats } = useTeamStorage();
  const { toast } = useToast();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveTeamName, setSaveTeamName] = useState(currentTeam.name || '');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  const handleSaveTeam = async () => {
    if (!saveTeamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive"
      });
      return;
    }

    if (!currentTeam.fullRoster || currentTeam.fullRoster.length === 0) {
      toast({
        title: "Error",
        description: "Cannot save team without players",
        variant: "destructive"
      });
      return;
    }

    try {
      const savedTeam = await saveTeam({
        ...currentTeam,
        name: saveTeamName.trim()
      });

      toast({
        title: "Team Saved! 💾",
        description: `${savedTeam.name} has been saved with ${savedTeam.fullRoster.length} players`,
      });

      setShowSaveDialog(false);
      setSaveTeamName('');
      onSaveComplete?.();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save team",
        variant: "destructive"
      });
    }
  };

  const handleLoadTeam = (teamId: string) => {
    const team = loadTeam(teamId);
    if (team) {
      onLoadTeam(team);
      toast({
        title: "Team Loaded! 📥",
        description: `${team.name} loaded with ${team.fullRoster.length} players`,
      });
      setShowLoadDialog(false);
    } else {
      toast({
        title: "Load Failed",
        description: "Could not load the selected team",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      deleteTeam(teamId);
      toast({
        title: "Team Deleted",
        description: `${teamName} has been removed from saved teams`,
      });
    }
  };

  const handleDuplicateTeam = (teamId: string, originalName: string) => {
    const newName = prompt(`Enter name for duplicate of "${originalName}":`, `${originalName} Copy`);
    if (newName && newName.trim()) {
      const duplicated = duplicateTeam(teamId, newName.trim());
      if (duplicated) {
        toast({
          title: "Team Duplicated! 📋",
          description: `Created "${duplicated.name}" as a copy of "${originalName}"`,
        });
      }
    }
  };

  const canSave = currentTeam.name && currentTeam.fullRoster && currentTeam.fullRoster.length > 0;

  return (
    <div className="space-y-4">
      {/* Team Management Controls */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gradient-primary">
          Team {teamNumber} Management
        </h4>
        <div className="flex space-x-2">
          <Button
            variant="cosmic"
            size="sm"
            onClick={() => setShowLoadDialog(true)}
            disabled={savedTeams.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Load Team
          </Button>
          <Button
            variant="score"
            size="sm"
            onClick={() => {
              setSaveTeamName(currentTeam.name || '');
              setShowSaveDialog(true);
            }}
            disabled={!canSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Team
          </Button>
        </div>
      </div>

      {/* Current Team Info */}
      {currentTeam.name && currentTeam.fullRoster && currentTeam.fullRoster.length > 0 && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{currentTeam.name}</div>
              <div className="text-sm text-muted-foreground">
                {currentTeam.fullRoster.length} players • 
                {currentTeam.playingXI?.length === teamSize ? ' Playing XI selected' : ' Playing XI pending'}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{currentTeam.fullRoster.length}</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Save Team Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="glass-card border-glass-border/30">
          <DialogHeader>
            <DialogTitle className="text-gradient-primary">Save Team</DialogTitle>
            <DialogDescription>
              Save this team to your database for future matches and tournaments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="save-team-name">Team Name</Label>
              <Input
                id="save-team-name"
                value={saveTeamName}
                onChange={(e) => setSaveTeamName(e.target.value)}
                placeholder="Enter team name"
                className="glass-card border-glass-border/20"
              />
            </div>
            
            {currentTeam.fullRoster && (
              <div className="p-3 glass-card border-glass-border/10 rounded">
                <div className="text-sm font-medium mb-2">Team Summary:</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Total Players: {currentTeam.fullRoster.length}</div>
                  <div>Batsmen: {currentTeam.fullRoster.filter(p => p.role === 'batsman').length}</div>
                  <div>Bowlers: {currentTeam.fullRoster.filter(p => p.role === 'bowler').length}</div>
                  <div>All-rounders: {currentTeam.fullRoster.filter(p => p.role === 'allrounder').length}</div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button onClick={handleSaveTeam} variant="cosmic" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Team
              </Button>
              <Button onClick={() => setShowSaveDialog(false)} variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Team Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="glass-card border-glass-border/30 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-gradient-primary">Load Saved Team</DialogTitle>
            <DialogDescription>
              Choose a saved team from your database to load into the current match setup.
            </DialogDescription>
          </DialogHeader>
          
          {savedTeams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium mb-2">No Saved Teams</div>
              <div className="text-muted-foreground">
                Save your first team to see it here
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Select a team to load ({savedTeams.length} saved teams):
              </div>
              
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {savedTeams
                  .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
                  .map((team) => {
                    const stats = getTeamStats(team.id);
                    return (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 glass-card border-glass-border/20 rounded-lg cursor-pointer transition-all hover:border-glass-border/40 ${
                          selectedTeamId === team.id ? 'border-primary bg-primary/10' : ''
                        }`}
                        onClick={() => setSelectedTeamId(team.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-lg">{team.name}</h3>
                              {team.captain && <Crown className="h-4 w-4 text-accent" />}
                              {team.wicketKeeper && <Shield className="h-4 w-4 text-secondary" />}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div className="space-y-1">
                                <div>Players: {stats?.totalPlayers}</div>
                                <div>Batsmen: {stats?.batsmen}</div>
                              </div>
                              <div className="space-y-1">
                                <div>Bowlers: {stats?.bowlers}</div>
                                <div>All-rounders: {stats?.allRounders}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Created: {team.createdAt.toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Used: {team.lastUsed.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              variant="score"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadTeam(team.id);
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateTeam(team.id, team.name);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeam(team.id, team.name);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button onClick={() => setShowLoadDialog(false)} variant="ghost">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
