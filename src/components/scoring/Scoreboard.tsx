import React from 'react';
import { Match, Innings, Player } from '@/types/cricket';
import { cricketUtils } from '@/constants/cricket';
import GlassCard from '../GlassCard';

interface ScoreboardProps {
  match: Match;
  currentInnings: Innings | null;
  battingTeam: any;
  bowlingTeam: any;
  currentBatsmen: { striker: Player; nonStriker: Player } | null;
  currentBowler: Player | null;
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  match,
  currentInnings,
  battingTeam,
  bowlingTeam,
  currentBatsmen,
  currentBowler
}) => {
  if (!currentInnings || !battingTeam || !bowlingTeam) {
    return (
      <GlassCard className="p-6">
        <div className="text-center text-slate-400">
          Loading match data...
        </div>
      </GlassCard>
    );
  }

  const currentRunRate = cricketUtils.calculateRunRate(
    currentInnings.score,
    currentInnings.overs,
    currentInnings.balls
  );

  const requiredRunRate = match.currentInnings === 2 && match.innings.first
    ? cricketUtils.calculateRequiredRunRate(
        match.innings.first.score + 1,
        currentInnings.score,
        match.totalOvers - currentInnings.overs,
        6 - currentInnings.balls
      )
    : 0;

  const target = match.currentInnings === 2 && match.innings.first
    ? match.innings.first.score + 1
    : undefined;

  const runsNeeded = target ? target - currentInnings.score : undefined;

  return (
    <GlassCard className="p-6">
      <div className="space-y-6">
        {/* Main Score Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h2 className="text-3xl font-bold text-gradient-primary">
              {battingTeam.name}
            </h2>
            <div className="text-4xl font-bold text-white">
              {currentInnings.score}/{currentInnings.wickets}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-lg text-slate-300">
            <span>Overs: {cricketUtils.formatOvers(currentInnings.overs, currentInnings.balls)}</span>
            <span>Run Rate: {currentRunRate.toFixed(2)}</span>
            {target && (
              <>
                <span>Target: {target}</span>
                <span className={runsNeeded! <= 0 ? 'text-green-400' : 'text-orange-400'}>
                  Need: {Math.max(0, runsNeeded!)}
                </span>
                {requiredRunRate > 0 && (
                  <span className={requiredRunRate > 12 ? 'text-red-400' : 'text-blue-400'}>
                    RRR: {requiredRunRate.toFixed(2)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Current Batsmen */}
        {currentBatsmen && (
          <div className="grid grid-cols-2 gap-4">
            {/* Striker */}
            <div className="p-4 bg-green-600/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-400">Striker *</span>
                <span className="text-xs text-slate-400">On Strike</span>
              </div>
              <div className="font-semibold text-white mb-1">
                {currentBatsmen.striker.name}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span>{currentBatsmen.striker.battingStats.runs} runs</span>
                <span>({currentBatsmen.striker.battingStats.ballsFaced} balls)</span>
                {currentBatsmen.striker.battingStats.strikeRate > 0 && (
                  <span>SR: {currentBatsmen.striker.battingStats.strikeRate.toFixed(1)}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                {currentBatsmen.striker.battingStats.fours > 0 && (
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                    4s: {currentBatsmen.striker.battingStats.fours}
                  </span>
                )}
                {currentBatsmen.striker.battingStats.sixes > 0 && (
                  <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                    6s: {currentBatsmen.striker.battingStats.sixes}
                  </span>
                )}
              </div>
            </div>

            {/* Non-Striker */}
            <div className="p-4 bg-slate-600/10 border border-slate-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-400">Non-Striker</span>
                <span className="text-xs text-slate-500">Off Strike</span>
              </div>
              <div className="font-semibold text-white mb-1">
                {currentBatsmen.nonStriker.name}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span>{currentBatsmen.nonStriker.battingStats.runs} runs</span>
                <span>({currentBatsmen.nonStriker.battingStats.ballsFaced} balls)</span>
                {currentBatsmen.nonStriker.battingStats.strikeRate > 0 && (
                  <span>SR: {currentBatsmen.nonStriker.battingStats.strikeRate.toFixed(1)}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                {currentBatsmen.nonStriker.battingStats.fours > 0 && (
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                    4s: {currentBatsmen.nonStriker.battingStats.fours}
                  </span>
                )}
                {currentBatsmen.nonStriker.battingStats.sixes > 0 && (
                  <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                    6s: {currentBatsmen.nonStriker.battingStats.sixes}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current Bowler */}
        {currentBowler && (
          <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-400">Current Bowler</span>
              <span className="text-xs text-slate-400">{bowlingTeam.name}</span>
            </div>
            <div className="font-semibold text-white mb-1">
              {currentBowler.name}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <span>
                {cricketUtils.formatOvers(currentBowler.bowlingStats.overs, currentBowler.bowlingStats.balls)} overs
              </span>
              <span>{currentBowler.bowlingStats.runs} runs</span>
              <span>{currentBowler.bowlingStats.wickets} wickets</span>
              {currentBowler.bowlingStats.economyRate > 0 && (
                <span>Econ: {currentBowler.bowlingStats.economyRate.toFixed(2)}</span>
              )}
            </div>
            {(currentBowler.bowlingStats.wides > 0 || currentBowler.bowlingStats.noBalls > 0) && (
              <div className="flex items-center gap-2 mt-2 text-xs">
                {currentBowler.bowlingStats.wides > 0 && (
                  <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded">
                    Wides: {currentBowler.bowlingStats.wides}
                  </span>
                )}
                {currentBowler.bowlingStats.noBalls > 0 && (
                  <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded">
                    No Balls: {currentBowler.bowlingStats.noBalls}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Match Status Indicators */}
        <div className="flex items-center justify-center gap-4 text-sm">
          {match.currentInnings === 1 && (
            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full">
              First Innings
            </span>
          )}
          {match.currentInnings === 2 && (
            <span className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded-full">
              Second Innings - Chasing {match.innings.first?.score! + 1}
            </span>
          )}
          
          {cricketUtils.isPowerplayActive(currentInnings.overs, match.matchType || 'T20') && (
            <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full">
              Powerplay
            </span>
          )}
          
          {currentInnings.overs >= match.totalOvers - 2 && (
            <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full">
              Death Overs
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default Scoreboard;
