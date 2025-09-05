import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTeamStorage } from '@/hooks/useTeamStorage';
import { Player } from '@/types/cricket';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, UserPlus, Users, 
  Crown, Shield, Target, Activity, Calendar
} from 'lucide-react';

interface PlayerBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelectPlayer: (player: Player) => void;
  excludePlayerIds?: string[];
}

export default function PlayerBrowser({ open, onClose, onSelectPlayer, excludePlayerIds = [] }: PlayerBrowserProps) {
  const { savedPlayers, isLoading, error } = useTeamStorage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Player['role'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'recent'>('name');

  // Convert database players to Player format
  const convertToPlayer = (dbPlayer: any): Player => ({
    id: dbPlayer.id,
    name: dbPlayer.name,
    role: dbPlayer.role,
    battingStats: {
      status: null,
      runs: dbPlayer.careerStats?.runsScored || 0,
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
      wickets: dbPlayer.careerStats?.wicketsTaken || 0,

      economyRate: 0,
      wides: 0,
      noBalls: 0
    },
    fieldingStats: {
      catches: dbPlayer.careerStats?.catches || 0,
      runOuts: dbPlayer.careerStats?.runOuts || 0,
      stumpings: 0
    }
  });

  // Filter and sort players
  const filteredPlayers = savedPlayers
    .filter(player => !excludePlayerIds.includes(player.id))
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || player.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'recent':
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        default:
          return 0;
      }
    });

  const handleSelectPlayer = (dbPlayer: any) => {
    const player = convertToPlayer(dbPlayer);
    onSelectPlayer(player);
    toast({
      title: "Player Added! 👤",
      description: `${player.name} (${player.role}) has been added to the team`,
    });
    onClose();
  };

  const getRoleIcon = (role: Player['role']) => {
    switch (role) {
      case 'batsman':
        return <Target className="h-4 w-4 text-blue-400" />;
      case 'bowler':
        return <Activity className="h-4 w-4 text-red-400" />;
      case 'allrounder':
        return <Crown className="h-4 w-4 text-purple-400" />;
      case 'wicketkeeper':
        return <Shield className="h-4 w-4 text-green-400" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: Player['role']) => {
    switch (role) {
      case 'batsman':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'bowler':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'allrounder':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'wicketkeeper':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-glass-border/30 max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-gradient-primary flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Browse Saved Players
          </DialogTitle>
          <DialogDescription>
            Search and select players from your database to add to the current team.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-card border-glass-border/20"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Player['role'] | 'all')}
                className="w-full p-2 glass-card border-glass-border/20 rounded-md bg-background text-foreground"
              >
                <option value="all">All Roles</option>
                <option value="batsman">Batsman</option>
                <option value="bowler">Bowler</option>
                <option value="allrounder">All-rounder</option>
                <option value="wicketkeeper">Wicket-keeper</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'role' | 'recent')}
                className="w-full p-2 glass-card border-glass-border/20 rounded-md bg-background text-foreground"
              >
                <option value="name">Sort by Name</option>
                <option value="role">Sort by Role</option>
                <option value="recent">Recently Used</option>
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredPlayers.length} of {savedPlayers.length} players
              {excludePlayerIds.length > 0 && ` (${excludePlayerIds.length} excluded)`}
            </span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Target className="h-3 w-3 mr-1 text-blue-400" />
                {savedPlayers.filter(p => p.role === 'batsman').length}
              </span>
              <span className="flex items-center">
                <Activity className="h-3 w-3 mr-1 text-red-400" />
                {savedPlayers.filter(p => p.role === 'bowler').length}
              </span>
              <span className="flex items-center">
                <Crown className="h-3 w-3 mr-1 text-purple-400" />
                {savedPlayers.filter(p => p.role === 'allrounder').length}
              </span>
              <span className="flex items-center">
                <Shield className="h-3 w-3 mr-1 text-green-400" />
                {savedPlayers.filter(p => p.role === 'wicketkeeper').length}
              </span>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="text-muted-foreground">Loading players...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 mb-2">Error loading players</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium mb-2">
                {searchQuery || roleFilter !== 'all' ? 'No matching players' : 'No saved players'}
              </div>
              <div className="text-muted-foreground">
                {searchQuery || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Add players to teams to see them here'
                }
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 glass-card border-glass-border/20 rounded-lg hover:border-glass-border/40 transition-all cursor-pointer"
                  onClick={() => handleSelectPlayer(player)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getRoleIcon(player.role)}
                      <div>
                        <div className="font-semibold text-lg">{player.name}</div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded border ${getRoleColor(player.role)}`}>
                            {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(player.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Career Stats */}
                    <div className="text-right">
                      <div className="text-sm font-medium">Career Stats</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {player.careerStats && (
                          <>
                            <div>Matches: {player.careerStats.matchesPlayed || 0}</div>
                            <div className="flex space-x-3">
                              <span>Runs: {player.careerStats.runsScored || 0}</span>
                              <span>Wickets: {player.careerStats.wicketsTaken || 0}</span>
                            </div>
                            <div className="flex space-x-3">
                              <span>Catches: {player.careerStats.catches || 0}</span>
                              <span>Run-outs: {player.careerStats.runOuts || 0}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="cosmic"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlayer(player);
                      }}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-glass-border/20">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
