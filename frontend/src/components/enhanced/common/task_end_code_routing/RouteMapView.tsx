import React from 'react';
import { 
  Box, 
  Typography, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  Tooltip,
  useMediaQuery,
  Stack
} from '@mui/material';
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
  const isMobile = useMediaQuery('(max-width:800px)');

  const handleRouteChange = (exitCode: number, nextTask: string | null, retry: boolean) => {
    if (!isViewMode) {
      onChange({
        ...routeMap,
        [exitCode]: [nextTask ?? null, retry],
      });
    }
  };

  const NextTaskSelector = ({ exitCode, nextTask, retry }: { 
    exitCode: number, 
    nextTask: string | null, 
    retry: boolean 
  }) => (
    isViewMode ? (
      <Typography>{nextTask || 'None'}</Typography>
    ) : (
      <Select
        value={nextTask || ''}
        onChange={(e) => handleRouteChange(exitCode, e.target.value || null, retry)}
        size="small"
        fullWidth
        className={classes.select}
        disabled={isViewMode}
      >
        <MenuItem value="">None</MenuItem>
        {availableTasks.map(task => (
          <MenuItem key={task} value={task}>{task}</MenuItem>
        ))}
      </Select>
    )
  );

  const RetryCheckbox = ({ exitCode, nextTask, retry }: { 
    exitCode: number, 
    nextTask: string | null, 
    retry: boolean 
  }) => (
    <Tooltip title="If checked, this end code will be taken as a retry attempt, useful to avoid loops. If disabled, the end code can be considered normal behavior">
      <FormControlLabel
        control={
          <Checkbox 
            checked={retry}
            onChange={(e) => handleRouteChange(exitCode, nextTask, e.target.checked)}
            size="small"
            disabled={isViewMode}
            className={classes.checkbox}
          />
        }
        label={isMobile ? "Retry" : ""}
        className={classes.formControlCheckbox}
      />
    </Tooltip>
  );

  if (isMobile) {
    return (
      <Box sx={{ mt: 2 }}>
        {Object.entries(exitCodes).map(([exitCode, description]) => {
          const [nextTask, retry] = routeMap[parseInt(exitCode)] || [null, false];
          const numericExitCode = parseInt(exitCode);
          
          return (
            <Box 
              key={exitCode} 
              sx={{ 
                mb: 3,
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Exit Code
                  </Typography>
                  <Typography variant="body1">
                    {exitCode}: {description}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Next Task
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <NextTaskSelector 
                      exitCode={numericExitCode} 
                      nextTask={nextTask} 
                      retry={retry} 
                    />
                  </Box>
                </Box>

                <Box>
                  <RetryCheckbox 
                    exitCode={numericExitCode} 
                    nextTask={nextTask} 
                    retry={retry} 
                  />
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '2fr 2fr 1fr',
          gap: 2,
          mb: 2,
          alignItems: 'center'
        }}
      >
        <Typography variant="subtitle2">Exit Code</Typography>
        <Typography variant="subtitle2">Next Task</Typography>
        <Typography variant="subtitle2" align="center">Retry</Typography>
      </Box>

      {Object.entries(exitCodes).map(([exitCode, description]) => {
        const [nextTask, retry] = routeMap[parseInt(exitCode)] || [null, false];
        const numericExitCode = parseInt(exitCode);

        return (
          <Box
            key={exitCode}
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1fr',
              gap: 2,
              mb: 2,
              alignItems: 'center',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <Typography variant="body2">
              {exitCode}: {description}
            </Typography>

            <NextTaskSelector 
              exitCode={numericExitCode} 
              nextTask={nextTask} 
              retry={retry} 
            />

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <RetryCheckbox 
                exitCode={numericExitCode} 
                nextTask={nextTask} 
                retry={retry} 
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default RouteMapView;