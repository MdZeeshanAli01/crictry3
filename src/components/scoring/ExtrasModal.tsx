import React from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (runs: number, extraType: string) => void;
  extraType: 'wide' | 'noball' | 'bye' | 'legbye' | 'noball-bye' | 'noball-legbye';
}

const ExtrasModal: React.FC<ExtrasModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  extraType
}) => {
  const getModalConfig = () => {
    switch (extraType) {
      case 'wide':
        return {
          title: 'Wide Ball',
          emoji: '↔️',
          color: 'yellow',
          description: 'Ball bowled too wide of the batsman',
          options: [1, 2, 3, 4, 5],
          formatLabel: (runs: number) => runs === 1 ? 'WD' : `WD+${runs - 1}`
        };
      case 'noball':
        return {
          title: 'No Ball',
          emoji: '🚫',
          color: 'red',
          description: 'Illegal delivery - Free hit next ball',
          options: [1, 2, 3, 4, 5, 6, 7],
          formatLabel: (runs: number) => runs === 1 ? 'NB' : `NB+${runs - 1}`
        };
      case 'bye':
        return {
          title: 'Byes',
          emoji: '👋',
          color: 'blue',
          description: 'Runs scored without bat touching ball',
          options: [1, 2, 3, 4],
          formatLabel: (runs: number) => `${runs}B`
        };
      case 'legbye':
        return {
          title: 'Leg Byes',
          emoji: '🦵',
          color: 'purple',
          description: 'Runs scored off the batsman\'s body',
          options: [1, 2, 3, 4],
          formatLabel: (runs: number) => `${runs}LB`
        };
      case 'noball-bye':
        return {
          title: 'No Ball + Byes',
          emoji: '🚫👋',
          color: 'cyan',
          description: 'No ball with additional bye runs',
          options: [1, 2, 3, 4],
          formatLabel: (runs: number) => `NB+${runs}B`
        };
      case 'noball-legbye':
        return {
          title: 'No Ball + Leg Byes',
          emoji: '🚫🦵',
          color: 'pink',
          description: 'No ball with additional leg bye runs',
          options: [1, 2, 3, 4],
          formatLabel: (runs: number) => `NB+${runs}LB`
        };
      default:
        return {
          title: 'Extra',
          emoji: '➕',
          color: 'gray',
          description: 'Additional runs',
          options: [1, 2, 3, 4],
          formatLabel: (runs: number) => `${runs}`
        };
    }
  };

  const config = getModalConfig();

  const getColorClasses = (color: string) => {
    const colorMap = {
      yellow: 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400',
      red: 'bg-red-600/20 hover:bg-red-600/30 text-red-400',
      blue: 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400',
      purple: 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400',
      cyan: 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400',
      pink: 'bg-pink-600/20 hover:bg-pink-600/30 text-pink-400',
      gray: 'bg-slate-600/20 hover:bg-slate-600/30 text-slate-400'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const handleConfirm = (runs: number) => {
    // Calculate total runs based on extra type
    let totalRuns = runs;
    if (extraType === 'noball' || extraType === 'noball-bye' || extraType === 'noball-legbye') {
      totalRuns = runs + 1; // No ball penalty + additional runs
    }
    
    onConfirm(totalRuns, extraType);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${config.emoji} ${config.title}`}
      size="sm"
    >
      <div className="space-y-6">
        {/* Description */}
        <div className="text-center">
          <p className="text-sm text-slate-300 mb-4">
            {config.description}
          </p>
        </div>

        {/* Run Options */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-slate-300 text-center">
            Select Runs
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {config.options.map((runs) => (
              <Button
                key={runs}
                onClick={() => handleConfirm(runs)}
                className={`h-12 text-lg font-semibold ${getColorClasses(config.color)}`}
              >
                {config.formatLabel(runs)}
              </Button>
            ))}
          </div>
        </div>

        {/* Special Notes */}
        {extraType === 'noball' && (
          <div className="p-3 bg-orange-600/10 border border-orange-500/20 rounded-lg">
            <p className="text-xs text-orange-300 text-center">
              ⚠️ Free hit will be awarded for the next delivery
            </p>
          </div>
        )}

        {(extraType === 'noball-bye' || extraType === 'noball-legbye') && (
          <div className="p-3 bg-orange-600/10 border border-orange-500/20 rounded-lg">
            <p className="text-xs text-orange-300 text-center">
              ⚠️ Includes 1 run penalty for no ball + additional runs
            </p>
          </div>
        )}

        {/* Cancel Button */}
        <Button
          onClick={onClose}
          className="w-full bg-slate-600/20 hover:bg-slate-600/30"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default ExtrasModal;
