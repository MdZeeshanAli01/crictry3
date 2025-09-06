import { renderHook, act } from '@testing-library/react-hooks';
import { useMatchScoring } from './useMatchScoring';
import { Match, Player, Team } from '@/types/cricket';

// Mock data for a simple match
const mockPlayer = (id: string, name: string): Player => ({
  id,
  name,
  role: 'batsman',
  battingStats: { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, isOut: false },
  bowlingStats: { runs: 0, balls: 0, overs: 0, wickets: 0, economyRate: 0, wides: 0, noBalls: 0 },
});

const teamA: Team = {
  name: 'Team A',
  fullRoster: [mockPlayer('1', 'Alice'), mockPlayer('2', 'Bob')],
  playingXI: [mockPlayer('1', 'Alice'), mockPlayer('2', 'Bob')],
};
const teamB: Team = {
  name: 'Team B',
  fullRoster: [mockPlayer('3', 'Charlie'), mockPlayer('4', 'Dave')],
  playingXI: [mockPlayer('3', 'Charlie'), mockPlayer('4', 'Dave')],
};

const initialMatch: Match = {
  team1: teamA,
  team2: teamB,
  battingFirst: 'Team A',
  currentInnings: 1,
  totalOvers: 1,
  isComplete: false,
  isLive: true,
  innings: {
    first: {
      score: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      extras: 0,
      isComplete: false,
      currentBatsmen: { striker: '1', nonStriker: '2' },
      currentBowler: '3',
    },
    second: {
      score: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      extras: 0,
      isComplete: false,
      currentBatsmen: { striker: '3', nonStriker: '4' },
      currentBowler: '1',
    },
  },
};

describe('useMatchScoring', () => {
  it('scores a run and rotates strike on odd runs', () => {
    let match = { ...initialMatch };
    const onMatchUpdate = (updated: any) => { match = updated; };
    const { result } = renderHook(() => useMatchScoring(match, onMatchUpdate));
    act(() => {
      result.current.updateScore(1);
    });
    expect(match.innings.first.score).toBe(1);
    expect(match.innings.first.currentBatsmen.striker).toBe('2'); // Strike rotated
  });

  it('does not count ball for wide', () => {
    let match = { ...initialMatch };
    const onMatchUpdate = (updated: any) => { match = updated; };
    const { result } = renderHook(() => useMatchScoring(match, onMatchUpdate));
    act(() => {
      result.current.updateScore(1, true, 'wide');
    });
    expect(match.innings.first.extras).toBe(1);
    expect(match.innings.first.balls).toBe(0);
  });

  it('handles wicket and increments wickets', () => {
    let match = { ...initialMatch };
    const onMatchUpdate = (updated: any) => { match = updated; };
    const { result } = renderHook(() => useMatchScoring(match, onMatchUpdate));
    act(() => {
      result.current.handleWicket('bowled');
    });
    expect(match.innings.first.wickets).toBe(1);
    expect(match.team1.playingXI[0].battingStats.isOut).toBe(true);
  });

  it('undoes last action', () => {
    let match = { ...initialMatch };
    const onMatchUpdate = (updated: any) => { match = updated; };
    const { result } = renderHook(() => useMatchScoring(match, onMatchUpdate));
    act(() => {
      result.current.updateScore(4);
      result.current.undoLastAction();
    });
    expect(match.innings.first.score).toBe(0);
  });

  it('completes innings when all out', () => {
    let match = { ...initialMatch };
    match.team1.playingXI = [mockPlayer('1', 'Alice')]; // Only one batsman
    match.innings.first.currentBatsmen = { striker: '1', nonStriker: '1' };
    const onMatchUpdate = (updated: any) => { match = updated; };
    const { result } = renderHook(() => useMatchScoring(match, onMatchUpdate));
    act(() => {
      result.current.handleWicket('bowled');
    });
    expect(match.innings.first.isComplete).toBe(true);
  });
});
