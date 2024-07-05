// src/pages/HomePage.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Dashboard from '../components/ui/Dashboard';
import Landing from '../components/ui/Landing';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Dashboard /> : <Landing />;
};

export default HomePage;
