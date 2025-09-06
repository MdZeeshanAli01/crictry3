import { Team, Player, Match } from '@/types/cricket';

export interface DatabaseTeam {
  id: string;
  name: string;
  fullRoster: Player[];
  captain?: string;
  wicketKeeper?: string;
  createdAt: string;
  lastUsed: string;
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
}

export interface DatabasePlayer {
  id: string;
  name: string;
  role: Player['role'];
  teamId?: string;
  careerStats?: {
    matchesPlayed: number;
    runsScored: number;
    wicketsTaken: number;
    catches: number;
    runOuts: number;
  };
  createdAt: string;
  lastUsed: string;
}

// Database configuration interface
export interface DatabaseConfig {
  type: 'firebase';
  projectId: string;
  apiKey: string;
}

class DatabaseService {
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    if (config.type !== 'firebase' || !config.projectId || !config.apiKey) {
      throw new Error('Firebase configuration is required with projectId and apiKey');
    }
    this.config = config;
  }

  // Teams CRUD operations
  async fetchTeams(): Promise<DatabaseTeam[]> {
    if (this.config.type !== 'firebase') {
      throw new Error('Only Firebase database is supported');
    }
    return this.fetchTeamsFromFirebase();
  }

  async saveTeam(team: Partial<Team>): Promise<DatabaseTeam> {
    if (this.config.type !== 'firebase') {
      throw new Error('Only Firebase database is supported');
    }

    const dbTeam: DatabaseTeam = {
      id: team.id || Date.now().toString(),
      name: team.name || '',
      fullRoster: team.fullRoster || [],
      captain: team.captain,
      wicketKeeper: team.wicketKeeper,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };

        return this.saveTeamToFirebase(dbTeam);
  }

  async deleteTeam(teamId: string): Promise<void> {
    if (this.config.type !== 'firebase') {
      throw new Error('Only Firebase database is supported');
    }
    return this.deleteTeamFromFirebase(teamId);
  }

  // Players CRUD operations
  async fetchPlayers(): Promise<DatabasePlayer[]> {
    if (this.config.type !== 'firebase') {
      throw new Error('Only Firebase database is supported');
    }
    return this.fetchPlayersFromFirebase();
  }

  async savePlayer(player: Player): Promise<DatabasePlayer> {
    if (this.config.type !== 'firebase') {
      throw new Error('Only Firebase database is supported');
    }

    const dbPlayer: DatabasePlayer = {
      id: player.id,
      name: player.name,
      role: player.role,
      careerStats: {
        matchesPlayed: 0,
        runsScored: player.battingStats.runs,
        wicketsTaken: player.bowlingStats.wickets,
        catches: player.fieldingStats.catches,
        runOuts: player.fieldingStats.runOuts
      },
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

        return this.savePlayerToFirebase(dbPlayer);
  }

  // Firebase implementations
  private async fetchTeamsFromFirebase(): Promise<DatabaseTeam[]> {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/teams`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teams from Firebase');
      }

      const data = await response.json();
      
      // Transform Firebase document format to our format
      const teams: DatabaseTeam[] = data.documents?.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        name: doc.fields.name?.stringValue || '',
        fullRoster: JSON.parse(doc.fields.fullRoster?.stringValue || '[]'),
        captain: doc.fields.captain?.stringValue,
        wicketKeeper: doc.fields.wicketKeeper?.stringValue,
        createdAt: doc.fields.createdAt?.stringValue || new Date().toISOString(),
        lastUsed: doc.fields.lastUsed?.stringValue || new Date().toISOString(),
        matchesPlayed: doc.fields.matchesPlayed?.integerValue || 0,
        wins: doc.fields.wins?.integerValue || 0,
        losses: doc.fields.losses?.integerValue || 0,
        draws: doc.fields.draws?.integerValue || 0
      })) || [];

      return teams;
    } catch (error) {
      console.error('Firebase fetch error:', error);
      throw error;
    }
  }

  private async saveTeamToFirebase(team: DatabaseTeam): Promise<DatabaseTeam> {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/teams/${team.id}`;
      
      const firebaseDoc = {
        fields: {
          name: { stringValue: team.name },
          fullRoster: { stringValue: JSON.stringify(team.fullRoster) },
          captain: { stringValue: team.captain || '' },
          wicketKeeper: { stringValue: team.wicketKeeper || '' },
          createdAt: { stringValue: team.createdAt },
          lastUsed: { stringValue: team.lastUsed },
          matchesPlayed: { integerValue: team.matchesPlayed || 0 },
          wins: { integerValue: team.wins || 0 },
          losses: { integerValue: team.losses || 0 },
          draws: { integerValue: team.draws || 0 }
        }
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(firebaseDoc)
      });

      if (!response.ok) {
        throw new Error('Failed to save team to Firebase');
      }

      return team;
    } catch (error) {
      console.error('Firebase save error:', error);
      throw error;
    }
  }

  private async deleteTeamFromFirebase(teamId: string): Promise<void> {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/teams/${teamId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete team from Firebase');
      }
    } catch (error) {
      console.error('Firebase delete error:', error);
      throw error;
    }
  }

  private async fetchPlayersFromFirebase(): Promise<DatabasePlayer[]> {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/players`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch players from Firebase');
      }

      const data = await response.json();
      
      // Transform Firebase document format to our format
      const players: DatabasePlayer[] = data.documents?.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        name: doc.fields.name?.stringValue || '',
        role: doc.fields.role?.stringValue as Player['role'] || 'batsman',
        teamId: doc.fields.teamId?.stringValue,
        careerStats: doc.fields.careerStats?.stringValue ? JSON.parse(doc.fields.careerStats.stringValue) : undefined,
        createdAt: doc.fields.createdAt?.stringValue || new Date().toISOString(),
        lastUsed: doc.fields.lastUsed?.stringValue || new Date().toISOString()
      })) || [];

      return players;
    } catch (error) {
      console.error('Firebase fetch error:', error);
      throw error;
    }
  }

  private async savePlayerToFirebase(player: DatabasePlayer): Promise<DatabasePlayer> {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/players/${player.id}`;
      
      const firebaseDoc = {
        fields: {
          name: { stringValue: player.name },
          role: { stringValue: player.role },
          teamId: { stringValue: player.teamId || '' },
          careerStats: { stringValue: JSON.stringify(player.careerStats || {}) },
          createdAt: { stringValue: player.createdAt },
          lastUsed: { stringValue: player.lastUsed }
        }
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(firebaseDoc)
      });

      if (!response.ok) {
        throw new Error('Failed to save player to Firebase');
      }

      return player;
    } catch (error) {
      console.error('Firebase save error:', error);
      throw error;
    }
  }

  // Match saving and loading
  async saveMatch(match: Match): Promise<void> {
    if (this.config.type !== 'firebase') {
      throw new Error('Match saving is only supported with Firebase');
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/matches/${match.id}`;
      
      const firebaseDoc = {
        fields: {
          matchData: { stringValue: JSON.stringify(match) },
          lastUpdated: { timestampValue: new Date().toISOString() },
          isComplete: { booleanValue: match.isComplete }
        }
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(firebaseDoc)
      });

      if (!response.ok) {
        throw new Error('Failed to save match to Firebase');
      }
    } catch (error) {
      console.error('Error saving match:', error);
      throw error;
    }
  }

  async fetchInProgressMatch(): Promise<Match | null> {
    if (this.config.type !== 'firebase') {
      throw new Error('Match fetching is only supported with Firebase');
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/matches`;
      const query = '?pageSize=1&orderBy=lastUpdated desc';
      
      const response = await fetch(url + query, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch match from Firebase');
      }

      const data = await response.json();
      if (!data.documents || data.documents.length === 0) {
        return null;
      }

      // Find the first incomplete match
      for (const doc of data.documents) {
        try {
          // Handle different Firebase document structures
          let matchData: any;
          
          if (doc.fields && doc.fields.matchData && doc.fields.matchData.stringValue) {
            // Structure: { fields: { matchData: { stringValue: "..." } } }
            matchData = JSON.parse(doc.fields.matchData.stringValue);
          } else if (doc.fields) {
            // Structure: { fields: { field1: { stringValue: "..." }, field2: { ... } } }
            // Convert Firebase fields to regular object
            matchData = {} as Record<string, any>;
            for (const [key, value] of Object.entries(doc.fields)) {
              if (typeof value === 'object' && value !== null) {
                if ('stringValue' in value) {
                  try {
                    matchData[key] = JSON.parse((value as any).stringValue);
                  } catch {
                    matchData[key] = (value as any).stringValue;
                  }
                } else if ('integerValue' in value) {
                  matchData[key] = parseInt((value as any).integerValue);
                } else if ('booleanValue' in value) {
                  matchData[key] = (value as any).booleanValue;
                } else {
                  matchData[key] = value;
                }
              }
            }
          } else {
            // Direct object structure
            matchData = doc;
          }
          
          if (!matchData.isComplete) {
            return matchData;
          }
        } catch (error) {
          console.error('Error parsing match data:', error);
          console.error('Document structure:', JSON.stringify(doc, null, 2));
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching match:', error);
      return null;
    }
  }

  async fetchAllInProgressMatches(): Promise<Match[]> {
    if (this.config.type !== 'firebase') {
      throw new Error('Match fetching is only supported with Firebase');
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/matches`;
      const query = '?pageSize=50&orderBy=lastUpdated desc';
      
      const response = await fetch(url + query, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch matches from Firebase');
      }

      const data = await response.json();
      if (!data.documents || data.documents.length === 0) {
        return [];
      }

      // Transform Firebase documents to Match objects and filter incomplete matches
      const matches: Match[] = data.documents
        .map((doc: any) => {
          try {
            // Handle different Firebase document structures
            let matchData;
            
            if (doc.fields && doc.fields.matchData && doc.fields.matchData.stringValue) {
              // Structure: { fields: { matchData: { stringValue: "..." } } }
              matchData = JSON.parse(doc.fields.matchData.stringValue);
            } else if (doc.fields) {
              // Structure: { fields: { field1: { stringValue: "..." }, field2: { ... } } }
              // Convert Firebase fields to regular object
              matchData = {};
              for (const [key, value] of Object.entries(doc.fields)) {
                if (typeof value === 'object' && value !== null) {
                  if ('stringValue' in value) {
                    try {
                      matchData[key] = JSON.parse((value as any).stringValue);
                    } catch {
                      matchData[key] = (value as any).stringValue;
                    }
                  } else if ('integerValue' in value) {
                    matchData[key] = parseInt((value as any).integerValue);
                  } else if ('booleanValue' in value) {
                    matchData[key] = (value as any).booleanValue;
                  } else {
                    matchData[key] = value;
                  }
                }
              }
            } else {
              // Direct object structure
              matchData = doc;
            }
            
            return matchData;
          } catch (error) {
            console.error('Error parsing match data:', error);
            console.error('Document structure:', JSON.stringify(doc, null, 2));
            return null;
          }
        })
        .filter((match: Match | null) => match !== null && !match.isComplete);

      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  // NEW METHOD: Fetch all matches (both paused and finished) from Firebase
  async fetchAllMatches(): Promise<Match[]> {
    if (this.config.type !== 'firebase') {
      throw new Error('Match fetching is only supported with Firebase');
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/matches`;
      const query = '?pageSize=100&orderBy=lastUpdated desc';
      
      const response = await fetch(url + query, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch matches from Firebase');
      }

      const data = await response.json();
      if (!data.documents || data.documents.length === 0) {
        return [];
      }

      // Transform Firebase documents to Match objects (include both paused and finished)
      const matches: Match[] = data.documents
        .map((doc: any) => {
          try {
            // Handle different Firebase document structures
            let matchData;
            
            if (doc.fields && doc.fields.matchData && doc.fields.matchData.stringValue) {
              // Structure: { fields: { matchData: { stringValue: "..." } } }
              matchData = JSON.parse(doc.fields.matchData.stringValue);
            } else if (doc.fields) {
              // Structure: { fields: { field1: { stringValue: "..." }, field2: { ... } } }
              // Convert Firebase fields to regular object
              matchData = {};
              for (const [key, value] of Object.entries(doc.fields)) {
                if (typeof value === 'object' && value !== null) {
                  if ('stringValue' in value) {
                    try {
                      matchData[key] = JSON.parse((value as any).stringValue);
                    } catch {
                      matchData[key] = (value as any).stringValue;
                    }
                  } else if ('integerValue' in value) {
                    matchData[key] = parseInt((value as any).integerValue);
                  } else if ('booleanValue' in value) {
                    matchData[key] = (value as any).booleanValue;
                  } else {
                    matchData[key] = value;
                  }
                }
              }
            } else {
              // Direct object structure
              matchData = doc;
            }
            
            return matchData;
          } catch (error) {
            console.error('Error parsing match data:', error);
            console.error('Document structure:', JSON.stringify(doc, null, 2));
            return null;
          }
        })
        .filter((match: Match | null) => match !== null);

      return matches;
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  }

  async deleteMatch(matchId: string): Promise<void> {
    if (this.config.type !== 'firebase') {
      throw new Error('Match deletion is only supported with Firebase');
    }

    try {
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/matches/${matchId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete match from Firebase');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }
}

// Create singleton instance with Firebase config
let databaseServiceInstance: DatabaseService | null = null;

// Export function to configure and get database service
export const configureDatabaseService = (config: DatabaseConfig): DatabaseService => {
  if (!databaseServiceInstance) {
    databaseServiceInstance = new DatabaseService(config);
  }
  return databaseServiceInstance;
};

// Export singleton instance getter
export const getDatabaseService = (): DatabaseService => {
  if (!databaseServiceInstance) {
    throw new Error('Database service not initialized. Call configureDatabaseService first.');
  }
  return databaseServiceInstance;
};

// Export for convenience
export const databaseService = getDatabaseService;
