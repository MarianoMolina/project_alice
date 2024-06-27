import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import Header from '../components/Header';
import '../App.css';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box className="main-layout">
      <Header />
      <Box component="main" className="main-layout-content">
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;