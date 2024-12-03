import React from 'react';
import { Box, Typography, Select, MenuItem, FormControlLabel, Checkbox, Tooltip } from '@mui/material';
import { RouteMap } from '../../../../types/TaskTypes';
import useStyles from './RoutingStyles';

interface RouteMapProps {
  routeMap: RouteMap;
  exitCodes: { [key: string]: string };
  availableTasks: string[];
  onChange: (newRouteMap: RouteMap) => void;
  isViewMode: boolean;
}

const RouteMapView: React.FC<RouteMapProps> = ({
  routeMap,
  exitCodes,
  availableTasks,
  onChange,
  isViewMode,
}) => {
  const classes = useStyles();

  const handleRouteChange = (exitCode: number, nextTask: string | null, retry: boolean) => {
    if (!isViewMode) {
      onChange({
        ...routeMap,
        [exitCode]: [nextTask ?? null, retry],
      });
    }
  };

  return (
    <Box ml={2}>
      <Box className={classes.routeItem}>
        <Typography variant="subtitle2">Exit Code</Typography>
        <Typography variant="subtitle2">Next Task</Typography>
        <Typography variant="subtitle2" align="center">Retry</Typography>
      </Box>
      {Object.entries(exitCodes).map(([exitCode, description]) => {
        const [nextTask, retry] = routeMap[parseInt(exitCode)] || [null, false];
        return (
          <Box key={exitCode} className={classes.routeItem}>
            <Typography variant="body2" className={classes.exitCodeDescription}>
              {exitCode}: {description}
            </Typography>
            {isViewMode ? (
              <Typography>{nextTask || 'None'}</Typography>
            ) : (
              <Select
                value={nextTask || undefined}
                onChange={(e) => handleRouteChange(parseInt(exitCode), (e.target.value as string ?? null), retry)}
                size="small"
                className={classes.select}
                disabled={isViewMode}
              >
                <MenuItem value={undefined}>None</MenuItem>
                {availableTasks.map(task => (
                  <MenuItem key={task} value={task}>{task}</MenuItem>
                ))}
              </Select>
            )}
            <Box className={classes.checkboxColumn}>
              <Tooltip title="If checked, this end code will be taken as a retry attempt, useful to avoid loops. If disabled, the end code can be considered normal behavior">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={retry}
                      onChange={(e) => handleRouteChange(parseInt(exitCode), nextTask, e.target.checked)}
                      size="small"
                      disabled={isViewMode}
                      className={classes.checkbox}
                    />
                  }
                  label=""
                  className={classes.formControlCheckbox}
                />
              </Tooltip>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default RouteMapView;