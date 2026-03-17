import { useState, useEffect, useCallback } from 'react';

// Default OTP resend cooldown in seconds (2 minutes)
const DEFAULT_COOLDOWN_SECONDS = 120;

interface UseCountdownReturn {
  secondsLeft: number;
  isActive: boolean;
  formattedTime: string;
  start: (seconds?: number) => void;
  reset: () => void;
}

/**
 * Hook for managing OTP resend countdown timer
 *
 * @param initialSeconds - Initial countdown duration (default: 120 seconds)
 * @param autoStart - Whether to start countdown automatically (default: false)
 */
export function useCountdown(
  initialSeconds: number = DEFAULT_COOLDOWN_SECONDS,
  autoStart: boolean = false
): UseCountdownReturn {
  const [secondsLeft, setSecondsLeft] = useState(autoStart ? initialSeconds : 0);
  const [isActive, setIsActive] = useState(autoStart);

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) {
      if (secondsLeft <= 0 && isActive) {
        setIsActive(false);
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const start = useCallback((seconds: number = initialSeconds) => {
    setSecondsLeft(seconds);
    setIsActive(true);
  }, [initialSeconds]);

  const reset = useCallback(() => {
    setSecondsLeft(0);
    setIsActive(false);
  }, []);

  // Format as "M:SS" (e.g., "1:50", "0:30")
  const formattedTime = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return {
    secondsLeft,
    isActive,
    formattedTime,
    start,
    reset,
  };
}
