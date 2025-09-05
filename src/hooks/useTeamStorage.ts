import { useState, useEffect } from 'react';
import { Team, Player } from '@/types/cricket';
import { getDatabaseService, DatabaseTeam, DatabasePlayer } from '@/services/databaseService';

interface SavedTeam {
  id: string;
  name: string;
  fullRoster: Player[];
  captain?: string;
  wicketKeeper?: string;
  createdAt: Date;
  lastUsed: Date;
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
}

export function useTeamStorage() {
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [savedPlayers, setSavedPlayers] = useState<DatabasePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved teams and players from database on mount
  useEffect(() => {
    loadTeamsAndPlayers();
  }, []);

  const loadTeamsAndPlayers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get database service instance
      const databaseService = getDatabaseService();
      
      // Fetch teams and players from database
      const [dbTeams, dbPlayers] = await Promise.all([
        databaseService.fetchTeams(),
        databaseService.fetchPlayers()
      ]);

      // Convert database teams to SavedTeam format
      const teams = dbTeams.map((team: DatabaseTeam) => ({
        ...team,
        createdAt: new Date(team.createdAt),
        lastUsed: new Date(team.lastUsed)
      }));

      setSavedTeams(teams);
      setSavedPlayers(dbPlayers);
    } catch (error) {
      console.error('Error loading teams and players:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTeam = async (team: Partial<Team>) => {
    if (!team.name || !team.fullRoster || team.fullRoster.length === 0) {
      throw new Error('Team must have a name and at least one player');
    }

    try {
      // Get database service instance and save to database
      const databaseService = getDatabaseService();
      const dbTeam = await databaseService.saveTeam(team);
      
      // Convert to SavedTeam format
      const savedTeam: SavedTeam = {
        ...dbTeam,
        createdAt: new Date(dbTeam.createdAt),
        lastUsed: new Date(dbTeam.lastUsed)
      };

      // Update local state
      setSavedTeams(prev => {
        const existingIndex = prev.findIndex(t => t.id === savedTeam.id || t.name === savedTeam.name);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...savedTeam, createdAt: prev[existingIndex].createdAt };
          return updated;
        } else {
          return [...prev, savedTeam];
        }
      });

      // Save individual players to database
      if (team.fullRoster) {
        const databaseService = getDatabaseService();
        for (const player of team.fullRoster) {
          await databaseService.savePlayer(player);
        }
        // Refresh players list
        const updatedPlayers = await databaseService.fetchPlayers();
        setSavedPlayers(updatedPlayers);
      }

      return savedTeam;
    } catch (error) {
      console.error('Error saving team:', error);
      throw error;
    }
  };

  const loadTeam = (teamId: string): Team | null => {
    const savedTeam = savedTeams.find(t => t.id === teamId);
    if (!savedTeam) return null;

    // Update last used date
    setSavedTeams(prev => 
      prev.map(t => 
        t.id === teamId 
          ? { ...t, lastUsed: new Date() }
          : t
      )
    );

    // Convert SavedTeam to Team format
    return {
      id: savedTeam.id,
      name: savedTeam.name,
      fullRoster: savedTeam.fullRoster,
      playingXI: [], // Will be selected fresh for each match
      captain: savedTeam.captain,
      wicketKeeper: savedTeam.wicketKeeper
    };
  };

  const deleteTeam = async (teamId: string) => {
    try {
      // Get database service instance and delete from database
      const databaseService = getDatabaseService();
      await databaseService.deleteTeam(teamId);
      
      // Update local state
      setSavedTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  };

  const duplicateTeam = (teamId: string, newName: string) => {
    const originalTeam = savedTeams.find(t => t.id === teamId);
    if (!originalTeam) return null;

    const duplicatedTeam: SavedTeam = {
      ...originalTeam,
      id: Date.now().toString(),
      name: newName,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    setSavedTeams(prev => [...prev, duplicatedTeam]);
    return duplicatedTeam;
  };

  const getTeamStats = (teamId: string) => {
    const team = savedTeams.find(t => t.id === teamId);
    if (!team) return null;

    return {
      totalPlayers: team.fullRoster.length,
      batsmen: team.fullRoster.filter(p => p.role === 'batsman').length,
      bowlers: team.fullRoster.filter(p => p.role === 'bowler').length,
      allRounders: team.fullRoster.filter(p => p.role === 'allrounder').length,
      wicketKeepers: team.fullRoster.filter(p => p.role === 'wicketkeeper').length,
      createdAt: team.createdAt,
      lastUsed: team.lastUsed
    };
  };

  return {
    savedTeams,
    savedPlayers,
    isLoading,
    error,
    saveTeam,
    loadTeam,
    deleteTeam,
    duplicateTeam,
    getTeamStats,
    loadTeamsAndPlayers
  };
}
