import React, { useMemo } from 'react';
import { Match, Innings, Player } from '@/types/cricket';
import { cricketUtils, CRICKET_CONSTANTS } from '@/constants/cricket';
import GlassCard from '../GlassCard';
import { Button } from '../ui/button';
import { TrendingUp, Target, Clock, Users } from 'lucide-react';

interface MatchStatisticsProps {
  match: Match;
  currentInnings: Innings | null;
  battingTeam: any;
  bowlingTeam: any;
  onShowScorecard: () => void;
}

const MatchStatistics: React.FC<MatchStatisticsProps> = ({
  match,
  currentInnings,
  battingTeam,
  bowlingTeam,
  onShowScorecard
}) => {
  const statistics = useMemo(() => {
    if (!currentInnings || !battingTeam) return null;

    // Safely calculate current run rate with NaN protection
    const currentRunRate = cricketUtils.calculateRunRate(
      currentInnings.score || 0,
      currentInnings.overs || 0,
      currentInnings.balls || 0
    );

    const ballsRemaining = Math.max(0, (match.totalOvers * CRICKET_CONSTANTS.BALLS_PER_OVER) - 
                          ((currentInnings.overs || 0) * CRICKET_CONSTANTS.BALLS_PER_OVER + (currentInnings.balls || 0)));

    // Protect against NaN in projected score calculation
    const projectedScore = match.currentInnings === 1 
      ? (isNaN(currentRunRate) || !isFinite(currentRunRate) ? (currentInnings.score || 0) : Math.round(currentRunRate * match.totalOvers))
      : (currentInnings.score || 0);

    // Safely calculate required run rate with NaN protection
    const requiredRunRate = match.currentInnings === 2 && match.innings.first && match.innings.first.score !== undefined
      ? cricketUtils.calculateRequiredRunRate(
          match.innings.first.score + 1,
          currentInnings.score || 0,
          Math.floor(ballsRemaining / CRICKET_CONSTANTS.BALLS_PER_OVER),
          ballsRemaining % CRICKET_CONSTANTS.BALLS_PER_OVER
        )
      : 0;

    // Calculate phase statistics
    const powerplayOvers = match.matchType === 'T20' 
      ? CRICKET_CONSTANTS.T20_POWERPLAY_OVERS 
      : CRICKET_CONSTANTS.ODI_POWERPLAY_OVERS;
    
    const isPowerplay = currentInnings.overs < powerplayOvers;
    const isMiddleOvers = currentInnings.overs >= powerplayOvers && currentInnings.overs < (match.totalOvers - 4);
    const isDeathOvers = currentInnings.overs >= (match.totalOvers - 4);

    // Get top performers with proper null/undefined checks
    const topBatsman = battingTeam.playingXI && Array.isArray(battingTeam.playingXI)
      ? battingTeam.playingXI
          .filter((p: Player) => p && p.battingStats && (p.battingStats.ballsFaced || 0) > 0)
          .sort((a: Player, b: Player) => (b.battingStats?.runs || 0) - (a.battingStats?.runs || 0))[0]
      : null;

    const topBowler = bowlingTeam && bowlingTeam.playingXI && Array.isArray(bowlingTeam.playingXI)
      ? bowlingTeam.playingXI
          .filter((p: Player) => p && p.bowlingStats && ((p.bowlingStats.overs || 0) > 0 || (p.bowlingStats.balls || 0) > 0))
          .sort((a: Player, b: Player) => {
            // Sort by wickets first, then by economy rate
            const aWickets = a.bowlingStats?.wickets || 0;
            const bWickets = b.bowlingStats?.wickets || 0;
            if (bWickets !== aWickets) {
              return bWickets - aWickets;
            }
            const aEconomy = a.bowlingStats?.economyRate || 0;
            const bEconomy = b.bowlingStats?.economyRate || 0;
            // Handle NaN economy rates
            if (isNaN(aEconomy) && isNaN(bEconomy)) return 0;
            if (isNaN(aEconomy)) return 1;
            if (isNaN(bEconomy)) return -1;
            return aEconomy - bEconomy;
          })[0]
      : null;

    return {
      currentRunRate: isNaN(currentRunRate) || !isFinite(currentRunRate) ? 0 : currentRunRate,
      ballsRemaining: Math.max(0, ballsRemaining),
      projectedScore: isNaN(projectedScore) ? (currentInnings.score || 0) : projectedScore,
      requiredRunRate: isNaN(requiredRunRate) || !isFinite(requiredRunRate) ? 0 : requiredRunRate,
      isPowerplay,
      isMiddleOvers,
      isDeathOvers,
      topBatsman,
      topBowler,
      wicketsRemaining: Math.max(0, cricketUtils.getMaxWickets(battingTeam.playingXI?.length || 11) - (currentInnings.wickets || 0))
    };
  }, [match, currentInnings, battingTeam, bowlingTeam]);

  if (!statistics || !currentInnings) {
    return null;
  }

  const getPhaseColor = () => {
    if (statistics.isPowerplay) return 'text-purple-400';
    if (statistics.isDeathOvers) return 'text-red-400';
    return 'text-blue-400';
  };

  const getPhaseLabel = () => {
    if (statistics.isPowerplay) return 'Powerplay';
    if (statistics.isDeathOvers) return 'Death Overs';
    return 'Middle Overs';
  };

  return (
    <div className="space-y-4">
      {/* Match Phase & Key Stats */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gradient-primary">Match Statistics</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor()} bg-current bg-opacity-10`}>
            {getPhaseLabel()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Current Run Rate */}
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-sm text-slate-400">Run Rate</div>
              <div className="text-lg font-semibold text-white">
                {statistics.currentRunRate.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Projected/Target */}
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-green-400" />
            <div>
              <div className="text-sm text-slate-400">
                {match.currentInnings === 1 ? 'Projected' : 'Target'}
              </div>
              <div className="text-lg font-semibold text-white">
                {match.currentInnings === 1 
                  ? statistics.projectedScore 
                  : match.innings.first?.score! + 1
                }
              </div>
            </div>
          </div>

          {/* Balls Remaining */}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-orange-400" />
            <div>
              <div className="text-sm text-slate-400">Balls Left</div>
              <div className="text-lg font-semibold text-white">
                {statistics.ballsRemaining}
              </div>
            </div>
          </div>

          {/* Wickets Remaining */}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-red-400" />
            <div>
              <div className="text-sm text-slate-400">Wickets Left</div>
              <div className="text-lg font-semibold text-white">
                {statistics.wicketsRemaining}
              </div>
            </div>
          </div>
        </div>

        {/* Required Run Rate (Second Innings) */}
        {match.currentInnings === 2 && statistics.requiredRunRate > 0 && (
          <div className="mt-4 p-3 bg-orange-600/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-300">Required Run Rate</span>
              <span className={`text-lg font-semibold ${
                statistics.requiredRunRate > 12 ? 'text-red-400' : 
                statistics.requiredRunRate > 8 ? 'text-orange-400' : 'text-green-400'
              }`}>
                {statistics.requiredRunRate.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-orange-400 mt-1">
              {statistics.requiredRunRate > 12 
                ? '🔥 Very difficult chase' 
                : statistics.requiredRunRate > 8 
                  ? '⚠️ Challenging chase' 
                  : '✅ Manageable chase'
              }
            </div>
          </div>
        )}
      </GlassCard>

      {/* Top Performers */}
      <GlassCard className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-gradient-primary">Top Performers</h3>
        
        <div className="space-y-3">
          {/* Top Batsman */}
          {statistics.topBatsman && (
            <div className="flex items-center justify-between p-3 bg-green-600/10 border border-green-500/20 rounded-lg">
              <div>
                <div className="font-medium text-white">{statistics.topBatsman.name}</div>
                <div className="text-sm text-green-400">Top Scorer</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-white">
                  {statistics.topBatsman.battingStats?.runs || 0}*
                </div>
                <div className="text-xs text-slate-400">
                  ({statistics.topBatsman.battingStats?.ballsFaced || 0} balls)
                </div>
              </div>
            </div>
          )}

          {/* Top Bowler */}
          {statistics.topBowler && (
            <div className="flex items-center justify-between p-3 bg-red-600/10 border border-red-500/20 rounded-lg">
              <div>
                <div className="font-medium text-white">{statistics.topBowler.name}</div>
                <div className="text-sm text-red-400">Best Bowler</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-white">
                  {statistics.topBowler.bowlingStats?.wickets || 0}/{statistics.topBowler.bowlingStats?.runs || 0}
                </div>
                <div className="text-xs text-slate-400">
                  ({cricketUtils.formatOvers(statistics.topBowler.bowlingStats?.overs || 0, statistics.topBowler.bowlingStats?.balls || 0)} ov)
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-gradient-primary">Quick Actions</h3>
        
        <div className="space-y-2">
          <Button
            onClick={onShowScorecard}
            className="w-full h-10 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
          >
            📊 View Full Scorecard
          </Button>
          
          <Button
            onClick={() => {/* TODO: Implement match summary */}}
            className="w-full h-10 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400"
          >
            📈 Match Summary
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default MatchStatistics;
