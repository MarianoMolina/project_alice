import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RedirectIfAuthenticatedProps {
  element: React.ReactElement;
  redirectTo?: string;
}

const RedirectIfAuthenticated: React.FC<RedirectIfAuthenticatedProps> = ({
  element,
  redirectTo = '/'
}) => {
  const { isAuthenticated } = useAuth();

  // If user is authenticated, redirect to the specified path (defaults to home)
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If user is not authenticated, render the provided element
  return element;
};

export default RedirectIfAuthenticated;