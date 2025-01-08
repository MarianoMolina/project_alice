import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RedirectIfAuthenticatedProps {
  element: React.ReactElement;
  redirectTo?: string;
}

const RedirectIfAuthenticated: React.FC<RedirectIfAuthenticatedProps> = ({
  element,
  redirectTo = '/'
}) => {
  const { isAuthenticated, needsOnboarding } = useAuth();
  const location = useLocation();

  // If user is authenticated, redirect to the specified path (defaults to home)
  // If its the registration page and the user needs onboarding, stay in registration
  if (isAuthenticated && !(location.pathname === '/register' && needsOnboarding)) {
    return <Navigate to={needsOnboarding ? '/register' : redirectTo} replace />;
  }

  // If user is not authenticated, render the provided element
  return element;
};

export default RedirectIfAuthenticated;