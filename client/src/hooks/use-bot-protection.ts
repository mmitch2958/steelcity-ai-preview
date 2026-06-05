import { useState, useEffect, useCallback } from "react";

interface BotProtectionState {
  honeypot: string;
  timestamp: number;
}

interface BotProtectionResult {
  honeypotValue: string;
  setHoneypotValue: (value: string) => void;
  isHuman: () => boolean;
  getProtectionData: () => { hp: string; ts: number };
  resetProtection: () => void;
}

const MIN_FORM_TIME_MS = 3000;

export function useBotProtection(): BotProtectionResult {
  const [state, setState] = useState<BotProtectionState>({
    honeypot: "",
    timestamp: Date.now(),
  });

  useEffect(() => {
    setState(prev => ({
      ...prev,
      timestamp: Date.now(),
    }));
  }, []);

  const setHoneypotValue = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      honeypot: value,
    }));
  }, []);

  const isHuman = useCallback((): boolean => {
    const timeSinceLoad = Date.now() - state.timestamp;
    const hasEmptyHoneypot = state.honeypot === "";
    const hasMinTime = timeSinceLoad >= MIN_FORM_TIME_MS;
    
    return hasEmptyHoneypot && hasMinTime;
  }, [state.honeypot, state.timestamp]);

  const getProtectionData = useCallback(() => {
    return {
      hp: state.honeypot,
      ts: state.timestamp,
    };
  }, [state.honeypot, state.timestamp]);

  const resetProtection = useCallback(() => {
    setState({
      honeypot: "",
      timestamp: Date.now(),
    });
  }, []);

  return {
    honeypotValue: state.honeypot,
    setHoneypotValue,
    isHuman,
    getProtectionData,
    resetProtection,
  };
}
