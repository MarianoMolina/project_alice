import React from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { List, ViewList, TableChart } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

const useStyles = makeStyles((theme: Theme) => ({
  toggleBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.5),
  },
  title: {
    fontWeight: 'bold',
  },
  toggleGroup: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
  },
}));

interface ToggleBoxProps {
  activeTab: string;
  viewMode: 'list' | 'shortList' | 'table';
  handleViewModeChange: (event: React.MouseEvent<HTMLElement>, newMode: 'list' | 'shortList' | 'table' | null) => void;
}

const ToggleBox: React.FC<ToggleBoxProps> = ({ activeTab, viewMode, handleViewModeChange }) => {
  const classes = useStyles();

  return (
    <Box className={classes.toggleBox}>
      <Typography variant="h6" className={classes.title}>
        {activeTab}
      </Typography>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleViewModeChange}
        aria-label="view mode"
        className={classes.toggleGroup}
      >
        <Tooltip title="Condensed List View" arrow>
          <ToggleButton value="shortList" aria-label="short list view">
            <List />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Full List View" arrow>
          <ToggleButton value="list" aria-label="list view">
            <ViewList />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Table View" arrow>
          <ToggleButton value="table" aria-label="table view">
            <TableChart />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ToggleBox;