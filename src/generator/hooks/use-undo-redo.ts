import { useState, useCallback } from 'react';

export interface HistoryState {
  prompt: string;
  series: string[];
}

export function useUndoRedo(initialState: HistoryState) {
  const [past, setPast] = useState<HistoryState[]>([]);
  const [present, setPresent] = useState<HistoryState>(initialState);
  const [future, setFuture] = useState<HistoryState[]>([]);

  // Update present state without pushing to history
  const update = useCallback((newState: Partial<HistoryState>) => {
    setPresent((prev) => ({ ...prev, ...newState }));
  }, []);

  // Push current present state to history
  const commit = useCallback(() => {
    setPast((prev) => {
      // Don't push if it's identical to the last state
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.prompt === present.prompt && JSON.stringify(last.series) === JSON.stringify(present.series)) {
          return prev;
        }
      }
      return [...prev, present];
    });
    setFuture([]);
  }, [present]);

  // Update and commit immediately
  const setAndCommit = useCallback((newState: Partial<HistoryState>) => {
    setPresent((prev) => {
      const updated = { ...prev, ...newState };
      setPast((pastPrev) => {
        if (pastPrev.length > 0) {
          const last = pastPrev[pastPrev.length - 1];
          if (last.prompt === prev.prompt && JSON.stringify(last.series) === JSON.stringify(prev.series)) {
            return pastPrev;
          }
        }
        return [...pastPrev, prev];
      });
      setFuture([]);
      return updated;
    });
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setPast(newPast);
    setFuture((prev) => [present, ...prev]);
    setPresent(previous);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast((prev) => [...prev, present]);
    setFuture(newFuture);
    setPresent(next);
  }, [future, present]);

  return {
    state: present,
    update,
    commit,
    setAndCommit,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
