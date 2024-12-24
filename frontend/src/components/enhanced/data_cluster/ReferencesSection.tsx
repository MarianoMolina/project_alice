import React, { ReactNode } from 'react';
import { Box, Typography, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';

interface ReferencesSectionProps {
  title: string;
  children: ReactNode;
}

const useStyles = makeStyles((theme: Theme) => ({
  sectionContainer: {
    marginBottom: theme.spacing(3),
    '&:last-child': {
      marginBottom: 0,
    }
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    '& h6': {
      fontWeight: 600,
      color: theme.palette.text.primary,
    }
  },
  contentContainer: {
    position: 'relative',
    paddingLeft: theme.spacing(3),
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.secondary.light,
      opacity: 0.6,
    }
  },
  childWrapper: {
    '& > *': {
      marginBottom: theme.spacing(2),
      '&:last-child': {
        marginBottom: 0,
      }
    }
  }
}));

const ReferencesSection: React.FC<ReferencesSectionProps> = ({ title, children }) => {
  const classes = useStyles();

  if (!React.Children.count(children)) {
    return null;
  }

  return (
    <Box className={classes.sectionContainer}>
      <Box className={classes.titleContainer}>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Box className={classes.contentContainer}>
        <Box className={classes.childWrapper}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default ReferencesSection;