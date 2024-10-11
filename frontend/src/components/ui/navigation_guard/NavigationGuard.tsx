import React, { useEffect, useRef, useCallback } from 'react';
import { useBlocker, useLocation } from 'react-router-dom';

interface NavigationGuardProps {
  children: React.ReactNode;
  hasUnsavedChanges: boolean;
  onConfirmNavigation: () => void;
}

const NavigationGuard: React.FC<NavigationGuardProps> = ({ children, hasUnsavedChanges, onConfirmNavigation }) => {
  const location = useLocation();
  const lastLocationRef = useRef(location);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const blocker = useBlocker(
    useCallback(
      ({ nextLocation }: { nextLocation: { pathname: string } }) => 
        hasUnsavedChangesRef.current && nextLocation.pathname !== location.pathname,
      [location]
    )
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setTimeout(() => {
        const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
        if (confirmed) {
          onConfirmNavigation();
          blocker.proceed();
        } else {
          blocker.reset();
        }
      }, 0);
    }
  }, [blocker, onConfirmNavigation]);

  useEffect(() => {
    setTimeout(() => {
      lastLocationRef.current = location;
    }, 0);
  }, [location]);

  return <>{children}</>;
};

export default NavigationGuard;