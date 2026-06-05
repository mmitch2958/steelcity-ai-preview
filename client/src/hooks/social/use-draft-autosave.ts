// P2-B008: Drafts auto-save system
// Saves current CreatePostTab state to localStorage every 30s
// Provides restore and delete functionality

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'social-post-draft';
const AUTOSAVE_INTERVAL = 30_000; // 30 seconds

export interface DraftData {
  content: string;
  selectedPlatforms: string[];
  hashtags: string;
  scheduledAt: string;
  mediaUrls: string[];
  campaignId: string;
  mode: 'manual' | 'ai' | 'autonomous';
  briefing: string;
  savedAt: string;
}

interface UseDraftAutosaveOptions {
  /** Current form state to auto-save */
  getState: () => Omit<DraftData, 'savedAt'>;
  /** Callback to restore draft into form */
  onRestore: (draft: DraftData) => void;
  /** Whether auto-save is enabled */
  enabled?: boolean;
}

export function useDraftAutosave({
  getState,
  onRestore,
  enabled = true,
}: UseDraftAutosaveOptions) {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const getStateRef = useRef(getState);
  getStateRef.current = getState;

  // Check for existing draft on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw) as DraftData;
        // Only show restore if draft has meaningful content
        if (draft.content?.trim() || draft.briefing?.trim()) {
          setHasDraft(true);
          setLastSaved(draft.savedAt);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      const state = getStateRef.current();
      // Only save if there's something worth saving
      if (!state.content?.trim() && !state.briefing?.trim()) return;

      const draft: DraftData = {
        ...state,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setHasDraft(true);
      setLastSaved(draft.savedAt);
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);

  // Save now (manual trigger)
  const saveNow = useCallback(() => {
    const state = getStateRef.current();
    const draft: DraftData = {
      ...state,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setHasDraft(true);
    setLastSaved(draft.savedAt);
  }, []);

  // Restore draft
  const restoreDraft = useCallback(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as DraftData;
      onRestore(draft);
      setHasDraft(false);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
    }
  }, [onRestore]);

  // Delete draft
  const deleteDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasDraft(false);
    setLastSaved(null);
  }, []);

  return {
    hasDraft,
    lastSaved,
    saveNow,
    restoreDraft,
    deleteDraft,
  };
}
