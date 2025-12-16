import { useState, useCallback } from 'react';

/**
 * Generic Interface for History State
 */
interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export function useStudioHistory<T>(initialPresent: T) {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialPresent,
        future: []
    });

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    /**
     * Undoes the last action, moving current state to future and popping from past.
     * Returns the new present state to be applied.
     */
    const undo = useCallback((): T | null => {
        let result: T | null = null;
        setHistory(currentState => {
            if (currentState.past.length === 0) return currentState;

            const previous = currentState.past[currentState.past.length - 1];
            const newPast = currentState.past.slice(0, currentState.past.length - 1);

            result = previous;

            return {
                past: newPast,
                present: previous,
                future: [currentState.present, ...currentState.future]
            };
        });
        return result;
    }, []);

    /**
     * Redoes the last undone action.
     * Returns the new present state to be applied.
     */
    const redo = useCallback((): T | null => {
        let result: T | null = null;
        setHistory(currentState => {
            if (currentState.future.length === 0) return currentState;

            const next = currentState.future[0];
            const newFuture = currentState.future.slice(1);

            result = next;

            return {
                past: [...currentState.past, currentState.present],
                present: next,
                future: newFuture
            };
        });
        return result;
    }, []);

    /**
     * Pushes a new state to history.
     * Clears future stack.
     * @param newPresent The new state to record.
     */
    const pushState = useCallback((newPresent: T) => {
        setHistory(currentState => {
            // Optional: Prevent duplicate states (deep compare usually too expensive, but reference check is good)
            // Enhanced with JSON stringify for robust content check (prevents undoing to same state)
            if (currentState.present === newPresent || JSON.stringify(currentState.present) === JSON.stringify(newPresent)) {
                return currentState;
            }

            // Optional: Limit history size (e.g., 50 steps)
            const MAX_HISTORY = 50;
            const newPast = [...currentState.past, currentState.present];
            if (newPast.length > MAX_HISTORY) newPast.shift();

            return {
                past: newPast,
                present: newPresent,
                future: []
            };
        });
    }, []);

    /**
     * Reset history (e.g. on new project load)
     */
    const resetHistory = useCallback((initialState: T) => {
        setHistory({
            past: [],
            present: initialState,
            future: []
        });
    }, []);

    return {
        // historyState: history.present, // usage pattern might differ
        pushState,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory
    };
}
