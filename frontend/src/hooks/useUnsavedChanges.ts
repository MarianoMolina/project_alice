import { useEffect, useCallback, useRef } from 'react';

export function useUnsavedChanges<T>(
    currentState: T | null,
    originalState: T | null,
    setHasUnsavedChanges: (value: boolean) => void
) {
    const isInitialMount = useRef(true);

    const checkUnsavedChanges = useCallback(() => {
        if (currentState && originalState) {
            const hasChanges = JSON.stringify(currentState) !== JSON.stringify(originalState);
            setHasUnsavedChanges(hasChanges);
        }
    }, [currentState, originalState, setHasUnsavedChanges]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Use setTimeout to ensure this runs after state updates are committed
        setTimeout(() => {
            checkUnsavedChanges();
        }, 0);
    }, [currentState, checkUnsavedChanges]);

    return checkUnsavedChanges;
}