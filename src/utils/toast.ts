import { toast } from 'sonner';
import { CRICKET_CONSTANTS } from '@/constants/cricket';
import { ValidationResult, errorUtils } from './validation';

// Enhanced toast utilities with cricket-specific messaging
export const cricketToast = {
  // Success messages
  success: {
    scoreUpdate: (runs: number, isExtra: boolean = false) => {
      const message = isExtra 
        ? `${runs} extra${runs > 1 ? 's' : ''} added`
        : runs === 0 
          ? 'Dot ball' 
          : runs === 4 
            ? 'FOUR! Boundary scored' 
            : runs === 6 
              ? 'SIX! Maximum hit!' 
              : `${runs} run${runs > 1 ? 's' : ''} scored`;
      
      toast.success(message, {
        duration: runs >= 4 ? CRICKET_CONSTANTS.BOUNDARY_ANIMATION_DURATION : CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    },

    wicket: (dismissalType: string, playerName?: string) => {
      const message = playerName 
        ? `${playerName} is out (${dismissalType})`
        : `Wicket! ${dismissalType}`;
      
      toast.success(message, {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    matchSaved: () => {
      toast.success('Match saved successfully', {
        duration: CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    },

    matchCompleted: (result: string) => {
      toast.success(`Match Complete! ${result}`, {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    overCompleted: (overNumber: number) => {
      toast.success(`Over ${overNumber} completed`, {
        duration: CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    },

    inningsCompleted: (inningsNumber: number) => {
      toast.success(`Innings ${inningsNumber} completed`, {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    undoAction: () => {
      toast.success('Last action undone', {
        duration: CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    },

    teamSaved: (teamName: string) => {
      toast.success(`Team "${teamName}" saved successfully`, {
        duration: CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    },

    playerAdded: (playerName: string) => {
      toast.success(`${playerName} added to team`, {
        duration: CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    }
  },

  // Error messages
  error: {
    validation: (validation: ValidationResult) => {
      const userFriendlyErrors = validation.errors.map(error => 
        errorUtils.createUserFriendlyError(error)
      );
      
      toast.error(userFriendlyErrors.join('\n'), {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    scoring: (message: string) => {
      toast.error(`Scoring Error: ${message}`, {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    matchState: (message: string) => {
      toast.error(`Match Error: ${message}`, {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    database: (operation: string) => {
      toast.error(`Database Error: Failed to ${operation}. Please try again.`, {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    network: () => {
      toast.error('Network Error: Please check your internet connection', {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    generic: (message: string) => {
      toast.error(message, {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    }
  },

  // Warning messages
  warning: {
    validation: (validation: ValidationResult) => {
      if (validation.warnings && validation.warnings.length > 0) {
        toast.warning(validation.warnings.join('\n'), {
          duration: CRICKET_CONSTANTS.TOAST_DURATION,
        });
      }
    },

    powerplayEnding: () => {
      toast.warning('Powerplay ending next over', {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    lastWicket: () => {
      toast.warning('Last wicket! Innings will end with next dismissal', {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    freeHit: () => {
      toast.warning('Free Hit! Batsman cannot be dismissed (except run out)', {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    oversRemaining: (overs: number) => {
      if (overs <= 2) {
        toast.warning(`Only ${overs} over${overs !== 1 ? 's' : ''} remaining!`, {
          duration: CRICKET_CONSTANTS.TOAST_DURATION,
        });
      }
    },

    targetNear: (runsNeeded: number, ballsLeft: number) => {
      if (runsNeeded <= 10 && ballsLeft <= 12) {
        toast.warning(`${runsNeeded} needed from ${ballsLeft} balls`, {
          duration: CRICKET_CONSTANTS.TOAST_DURATION,
        });
      }
    }
  },

  // Info messages
  info: {
    matchStarted: () => {
      toast.info('Match started! Good luck to both teams', {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    inningsBreak: () => {
      toast.info('Innings break - Teams switching sides', {
        duration: CRICKET_CONSTANTS.TOAST_DURATION,
      });
    },

    bowlerChange: (newBowler: string) => {
      toast.info(`${newBowler} is now bowling`, {
        duration: CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    },

    newBatsman: (playerName: string) => {
      toast.info(`${playerName} comes to the crease`, {
        duration: CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    },

    strikeRotated: () => {
      toast.info('Strike rotated', {
        duration: 800,
      });
    },

    matchPaused: () => {
      toast.info('Match paused and saved', {
        duration: CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    },

    matchResumed: () => {
      toast.info('Match resumed', {
        duration: CRICKET_CONSTANTS.ANIMATION_DURATION,
      });
    }
  },

  // Loading messages
  loading: {
    savingMatch: () => {
      return toast.loading('Saving match...', {
        duration: Infinity,
      });
    },

    loadingMatch: () => {
      return toast.loading('Loading match...', {
        duration: Infinity,
      });
    },

    savingTeam: () => {
      return toast.loading('Saving team...', {
        duration: Infinity,
      });
    }
  },

  // Dismiss specific toast
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  }
};

// Haptic feedback for mobile devices
export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  },

  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  boundary: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  },

  wicket: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300]);
    }
  }
};

// Combined feedback system
export const cricketFeedback = {
  scoreUpdate: (runs: number, isExtra: boolean = false) => {
    cricketToast.success.scoreUpdate(runs, isExtra);
    
    if (runs === 4 || runs === 6) {
      hapticFeedback.boundary();
    } else if (runs > 0) {
      hapticFeedback.light();
    }
  },

  wicket: (dismissalType: string, playerName?: string) => {
    cricketToast.success.wicket(dismissalType, playerName);
    hapticFeedback.wicket();
  },

  error: (message: string) => {
    cricketToast.error.generic(message);
    hapticFeedback.medium();
  },

  validation: (validation: ValidationResult) => {
    if (!validation.isValid) {
      cricketToast.error.validation(validation);
      hapticFeedback.medium();
    } else if (validation.warnings && validation.warnings.length > 0) {
      cricketToast.warning.validation(validation);
      hapticFeedback.light();
    }
  }
};
