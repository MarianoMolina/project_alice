import React from 'react';
import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

const useStyles = makeStyles((theme: Theme) => ({
  headerBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.5),
    height: '56px',
    minHeight: '56px',
  },
  title: {
    fontWeight: 'normal',
  },
}));

interface TabHeaderProps {
  title: string;
  children?: React.ReactNode;
}

const TabHeader: React.FC<TabHeaderProps> = ({ title, children }) => {
  const classes = useStyles();

  return (
    <Box className={classes.headerBox}>
      <Typography variant="h6" className={classes.title}>
        {title}
      </Typography>
      {children}
    </Box>
  );
};

export default TabHeader;