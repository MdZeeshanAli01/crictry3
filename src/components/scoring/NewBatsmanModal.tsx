import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/button';
import { Player } from '@/types/cricket';

interface NewBatsmanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newBatsmanId: string) => void;
  availablePlayers: Player[];
  currentBatsmen: { striker: string; nonStriker: string };
  dismissedBatsmanId?: string;
}

const NewBatsmanModal: React.FC<NewBatsmanModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availablePlayers,
  currentBatsmen,
  dismissedBatsmanId
}) => {
  const [selectedBatsman, setSelectedBatsman] = useState<string>('');

  // Filter available players - exclude current batsmen and already dismissed players
  const eligiblePlayers = useMemo(() => {
    return availablePlayers.filter(player => {
      const isCurrentBatsman = player.id === currentBatsmen.striker || player.id === currentBatsmen.nonStriker;
      const isOut = player.battingStats.isOut && !player.battingStats.isRetiredHurt;
      
      return !isCurrentBatsman && !isOut;
    });
  }, [availablePlayers, currentBatsmen]);

  const handleConfirm = () => {
    if (selectedBatsman) {
      onConfirm(selectedBatsman);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedBatsman('');
    onClose();
  };

  const dismissedPlayer = availablePlayers.find(p => p.id === dismissedBatsmanId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🏏 New Batsman"
      size="md"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="space-y-6">
        {/* Dismissal Info */}
        {dismissedPlayer && (
          <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-300">
              <span className="font-medium">{dismissedPlayer.name}</span> is out
              {dismissedPlayer.battingStats.dismissalType && (
                <span> ({dismissedPlayer.battingStats.dismissalType})</span>
              )}
            </p>
          </div>
        )}

        {/* Player Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-slate-300">
            Select New Batsman ({eligiblePlayers.length} available)
          </h4>
          
          {eligiblePlayers.length === 0 ? (
            <div className="p-4 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-300">
                No eligible players available. All batsmen are either out or currently batting.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {eligiblePlayers.map((player) => (
                <Button
                  key={player.id}
                  onClick={() => setSelectedBatsman(player.id)}
                  className={`w-full h-16 text-left px-4 ${
                    selectedBatsman === player.id
                      ? 'bg-green-600/30 border-green-500/50 text-green-300'
                      : 'bg-slate-600/20 hover:bg-slate-600/30'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{player.name}</span>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{player.role}</span>
                      <span>
                        {player.battingStats.runs} runs 
                        ({player.battingStats.ballsFaced} balls)
                      </span>
                      {player.battingStats.strikeRate > 0 && (
                        <span>SR: {player.battingStats.strikeRate.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedBatsman || eligiblePlayers.length === 0}
            className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 disabled:opacity-50"
          >
            Confirm Selection
          </Button>
          
          {/* Only show cancel if there are no eligible players (innings would end) */}
          {eligiblePlayers.length === 0 && (
            <Button 
              onClick={handleClose}
              className="flex-1 bg-slate-600/20 hover:bg-slate-600/30"
            >
              End Innings
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-slate-400 text-center">
          {eligiblePlayers.length > 0 
            ? "Select a batsman to continue the innings"
            : "No more batsmen available - innings will end"
          }
        </div>
      </div>
    </Modal>
  );
};

export default NewBatsmanModal;
