import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import GlassCard from './GlassCard';
import { Team } from '@/types/cricket';
import { Coins, Target, Shield } from 'lucide-react';

interface TossSetupProps {
  team1: Team;
  team2: Team;
  onTossComplete: (tossWinner: string, decision: 'bat' | 'bowl') => void;
}

export default function TossSetup({ team1, team2, onTossComplete }: TossSetupProps) {
  const [tossWinner, setTossWinner] = useState<string | null>(null);
  const [showDecision, setShowDecision] = useState(false);

  const selectTossWinner = (winner: string) => {
    setTossWinner(winner);
    setShowDecision(true);
  };

  const makeDecision = (decision: 'bat' | 'bowl') => {
    if (tossWinner) {
      onTossComplete(tossWinner, decision);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gradient-aurora mb-4">
          Toss Time
        </h2>
        <div className="readable-text inline-block">
          <p className="text-foreground">
            The cosmic coin decides the fate of the match
          </p>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <GlassCard glow className="p-8">
          {!tossWinner ? (
            <div className="text-center space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gradient-primary mb-2">
                    {team1.name}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {team1.playingXI.length} players selected
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gradient-primary mb-2">
                    {team2.name}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {team2.playingXI.length} players selected
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-lg font-semibold text-gradient-aurora">
                  Who won the toss?
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Button
                    variant="cosmic"
                    size="lg"
                    onClick={() => selectTossWinner(team1.name)}
                    className="py-8 flex-col space-y-2"
                  >
                    <Coins className="h-8 w-8" />
                    <span className="text-lg">{team1.name}</span>
                  </Button>

                  <Button
                    variant="cosmic"
                    size="lg"
                    onClick={() => selectTossWinner(team2.name)}
                    className="py-8 flex-col space-y-2"
                  >
                    <Coins className="h-8 w-8" />
                    <span className="text-lg">{team2.name}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : !showDecision ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="text-2xl font-bold text-gradient-aurora">
                🪙 Toss Result 🪙
              </div>
              <div className="text-xl">
                <span className="text-gradient-primary font-semibold">
                  {tossWinner}
                </span>{' '}
                wins the toss!
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="text-xl">
                <span className="text-gradient-primary font-semibold">
                  {tossWinner}
                </span>{' '}
                won the toss. What's your decision?
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Button
                  variant="boundary"
                  size="lg"
                  onClick={() => makeDecision('bat')}
                  className="py-8 flex-col space-y-2"
                >
                  <Target className="h-8 w-8" />
                  <span className="text-lg">Bat First</span>
                  <span className="text-sm opacity-70">Set the target</span>
                </Button>

                <Button
                  variant="six"
                  size="lg"
                  onClick={() => makeDecision('bowl')}
                  className="py-8 flex-col space-y-2"
                >
                  <Shield className="h-8 w-8" />
                  <span className="text-lg">Bowl First</span>
                  <span className="text-sm opacity-70">Restrict the runs</span>
                </Button>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
