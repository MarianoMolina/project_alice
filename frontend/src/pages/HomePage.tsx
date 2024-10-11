// src/pages/HomePage.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../components/ui/dashboard/Dashboard';
import Landing from '../components/ui/landing/Landing';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Dashboard /> : <Landing />;
};

export default HomePage;
