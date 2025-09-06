import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/cricket';

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dismissalType: string, outBatsman?: string) => void;
  currentBatsmen: { striker: Player; nonStriker: Player } | null;
}

type DismissalType = 'bowled' | 'lbw' | 'caught' | 'hitWicket' | 'runOut' | 'stumped';

const WicketModal: React.FC<WicketModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentBatsmen
}) => {
  const [selectedDismissalType, setSelectedDismissalType] = useState<DismissalType>('bowled');
  const [outBatsman, setOutBatsman] = useState<string>('');

  const dismissalOptions = [
    { type: 'bowled', emoji: '🎯', label: 'Bowled' },
    { type: 'caught', emoji: '🤲', label: 'Caught' },
    { type: 'lbw', emoji: '🦵', label: 'LBW' },
    { type: 'stumped', emoji: '🧤', label: 'Stumped' },
    { type: 'hitWicket', emoji: '💥', label: 'Hit Wicket' },
    { type: 'runOut', emoji: '🏃', label: 'Run Out' },
  ];

  const handleConfirm = () => {
    onConfirm(selectedDismissalType, selectedDismissalType === 'runOut' ? outBatsman : undefined);
    handleClose();
  };

  const handleClose = () => {
    setSelectedDismissalType('bowled');
    setOutBatsman('');
    onClose();
  };

  const canConfirm = selectedDismissalType !== 'runOut' || outBatsman !== '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🏏 Wicket!"
      size="md"
    >
      <div className="space-y-6">
        {/* Dismissal Type Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-slate-300">Select Dismissal Type</h4>
          <div className="grid grid-cols-2 gap-3">
            {dismissalOptions.map(({ type, emoji, label }) => (
              <Button
                key={type}
                onClick={() => setSelectedDismissalType(type as DismissalType)}
                className={`h-10 text-sm ${
                  selectedDismissalType === type
                    ? 'bg-red-600/30 border-red-500/50 text-red-300'
                    : 'bg-slate-600/20 hover:bg-slate-600/30'
                }`}
              >
                {emoji} {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Run Out Batsman Selection */}
        {selectedDismissalType === 'runOut' && currentBatsmen && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-slate-300">Select Batsman Run Out</h4>
            <div className="space-y-2">
              <Button
                onClick={() => setOutBatsman(currentBatsmen.striker.id)}
                className={`w-full h-12 text-left px-4 ${
                  outBatsman === currentBatsmen.striker.id
                    ? 'bg-red-600/30 border-red-500/50 text-red-300'
                    : 'bg-slate-600/20 hover:bg-slate-600/30'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{currentBatsmen.striker.name}</span>
                  <span className="text-xs text-slate-400">Striker</span>
                </div>
              </Button>
              
              <Button
                onClick={() => setOutBatsman(currentBatsmen.nonStriker.id)}
                className={`w-full h-12 text-left px-4 ${
                  outBatsman === currentBatsmen.nonStriker.id
                    ? 'bg-red-600/30 border-red-500/50 text-red-300'
                    : 'bg-slate-600/20 hover:bg-slate-600/30'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{currentBatsmen.nonStriker.name}</span>
                  <span className="text-xs text-slate-400">Non-Striker</span>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleConfirm} 
            disabled={!canConfirm}
            className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 disabled:opacity-50"
          >
            Confirm Wicket
          </Button>
          <Button 
            onClick={handleClose}
            className="flex-1 bg-slate-600/20 hover:bg-slate-600/30"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WicketModal;
