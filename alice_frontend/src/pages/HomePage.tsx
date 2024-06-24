// src/pages/HomePage.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Dashboard from '../components/Dashboard';
import Landing from '../components/Landing';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Dashboard /> : <Landing />;
};

export default HomePage;
