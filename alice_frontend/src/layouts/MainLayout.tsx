import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import Header from '../components/Header';
import useStyles from '../styles/MainLayoutStyles';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const classes = useStyles();

  return (
    <Box className={classes.mainLayout}>
      <Box className={classes.mainLayoutHeader}>
        <Header />
      </Box>
      <Box component="main" className={classes.mainLayoutContent}>
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;