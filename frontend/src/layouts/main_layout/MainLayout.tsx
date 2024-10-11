import React, { memo, ReactNode, useMemo } from 'react';
import { Box } from '@mui/material';
import Header from '../../components/ui/header/Header';
import useStyles from './MainLayoutStyles';
import { WavyBackground } from '../../components/ui/aceternity/WavyBackground';

interface MainLayoutProps {
  children: ReactNode;
}

const MemoizedWavyBackground = memo(WavyBackground);

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const classes = useStyles();

  const backgroundProps = useMemo(() => ({
    className: classes.canvasContainer
  }), [classes.canvasContainer]);

  return (
    <MemoizedWavyBackground {...backgroundProps}>
      <Box className={classes.mainLayout}>
        <Box className={classes.mainLayoutHeader}>
          <Header />
        </Box>
        <Box component="main" className={classes.mainLayoutContent}>
          {children}
        </Box>
      </Box>
    </MemoizedWavyBackground>
  );
};

export default memo(MainLayout);