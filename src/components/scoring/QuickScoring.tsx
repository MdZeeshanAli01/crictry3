import React from 'react';
import { Button } from '@/components/ui/button';
import GlassCard from '../GlassCard';

interface QuickScoringProps {
  onScore: (runs: number) => void;
  onWicket: () => void;
  onExtra: (extraType: string) => void;
  freeHit: boolean;
  disabled?: boolean;
}

const QuickScoring: React.FC<QuickScoringProps> = ({
  onScore,
  onWicket,
  onExtra,
  freeHit,
  disabled = false
}) => {
  const runButtons = [0, 1, 2, 3, 4, 6];
  const extraButtons = [
    { type: 'wide', label: 'Wide', color: 'yellow' },
    { type: 'noball', label: 'No Ball', color: 'red' },
    { type: 'bye', label: 'Bye', color: 'blue' },
    { type: 'legbye', label: 'Leg Bye', color: 'purple' },
  ];

  const getRunButtonStyle = (runs: number) => {
    if (runs === 0) {
      return 'bg-slate-600/20 hover:bg-slate-600/30 text-slate-300';
    } else if (runs === 1 || runs === 2 || runs === 3) {
      return 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400';
    } else if (runs === 4) {
      return 'bg-green-600/20 hover:bg-green-600/30 text-green-400';
    } else if (runs === 6) {
      return 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400';
    }
    return 'bg-slate-600/20 hover:bg-slate-600/30 text-slate-300';
  };

  const getExtraButtonStyle = (color: string) => {
    const colorMap = {
      yellow: 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400',
      red: 'bg-red-600/20 hover:bg-red-600/30 text-red-400',
      blue: 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400',
      purple: 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-slate-600/20 hover:bg-slate-600/30 text-slate-400';
  };

  return (
    <div className="space-y-4">
      {/* Free Hit Indicator */}
      {freeHit && (
        <div className="p-3 bg-orange-600/20 border border-orange-500/50 rounded-lg text-center">
          <span className="text-orange-400 font-semibold">🎯 FREE HIT</span>
          <p className="text-xs text-orange-300 mt-1">
            Batsman cannot be dismissed (except run out)
          </p>
        </div>
      )}

      {/* Run Scoring Buttons */}
      <GlassCard className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-gradient-primary text-center">
          Quick Scoring
        </h3>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {runButtons.map((runs) => (
            <Button
              key={runs}
              onClick={() => onScore(runs)}
              disabled={disabled}
              className={`h-12 text-lg font-bold ${getRunButtonStyle(runs)} disabled:opacity-50`}
              aria-label={`Score ${runs} run${runs !== 1 ? 's' : ''}`}
            >
              {runs}
            </Button>
          ))}
        </div>

        {/* Wicket Button */}
        <Button
          onClick={onWicket}
          disabled={disabled}
          className="w-full h-12 text-lg font-bold bg-red-600/20 hover:bg-red-600/30 text-red-400 disabled:opacity-50 mb-4"
          aria-label="Record a wicket"
        >
          OUT
        </Button>
      </GlassCard>

      {/* Extras Buttons */}
      <GlassCard className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-gradient-primary text-center">
          Extras
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {extraButtons.map(({ type, label, color }) => (
            <Button
              key={type}
              onClick={() => onExtra(type)}
              disabled={disabled}
              className={`h-10 text-sm font-semibold ${getExtraButtonStyle(color)} disabled:opacity-50`}
              aria-label={`Record ${label.toLowerCase()}`}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Additional Extras Row */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Button
            onClick={() => onExtra('noball-bye')}
            disabled={disabled}
            className="h-10 text-sm font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 disabled:opacity-50"
            aria-label="Record no ball with byes"
          >
            NB + Bye
          </Button>
          <Button
            onClick={() => onExtra('noball-legbye')}
            disabled={disabled}
            className="h-10 text-sm font-semibold bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 disabled:opacity-50"
            aria-label="Record no ball with leg byes"
          >
            NB + LB
          </Button>
        </div>
      </GlassCard>

      {/* Keyboard Shortcuts Info */}
      <div className="text-xs text-slate-400 text-center space-y-1">
        <p>💡 Keyboard shortcuts:</p>
        <p>0-6: Score runs • W: Wicket • Space: Dot ball</p>
      </div>
    </div>
  );
};

export default QuickScoring;
