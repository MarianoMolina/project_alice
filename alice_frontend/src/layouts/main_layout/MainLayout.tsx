import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import Header from '../../components/ui/header/Header';
import useStyles from './MainLayoutStyles';
import { WavyBackground } from '../../components/ui/aceternity/WavyBackground';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const classes = useStyles();

  return (

    <WavyBackground className={classes.canvasContainer}>
      <Box className={classes.mainLayout}>
        <Box className={classes.mainLayoutHeader}>
          <Header />
        </Box>
        <Box component="main" className={classes.mainLayoutContent}>
          {children}
        </Box>
      </Box>
    </WavyBackground>
  );
};

export default MainLayout;