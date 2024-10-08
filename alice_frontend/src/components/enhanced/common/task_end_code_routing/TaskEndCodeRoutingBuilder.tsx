import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Select, MenuItem, Button, Alert } from '@mui/material';
import { AliceTask, RouteMap, TasksEndCodeRouting } from '../../../../types/TaskTypes';
import RouteMapView from './RouteMapView';
import { useNotification } from '../../../../contexts/NotificationContext';
import useStyles from './RoutingStyles';
import WarningIcon from '@mui/icons-material/Warning';

interface TaskEndCodeRoutingBuilderProps {
  tasks: AliceTask[];
  initialRouting?: TasksEndCodeRouting;
  onChange: (routing: TasksEndCodeRouting) => void;
  isViewMode?: boolean;
}

const TaskEndCodeRoutingBuilder: React.FC<TaskEndCodeRoutingBuilderProps> = ({
  tasks,
  initialRouting,
  onChange,
  isViewMode = false,
}) => {
  const [routing, setRouting] = useState<TasksEndCodeRouting>(initialRouting || {});
  const [warnings, setWarnings] = useState<string[]>([]);
  const { addNotification } = useNotification();
  const classes = useStyles();

  const validateRouting = useCallback(() => {
    const newWarnings: string[] = [];
    tasks.forEach(task => {
      if (!routing[task.task_name]) {
        newWarnings.push(`Task "${task.task_name}" is missing from the routing.`);
      } else {
        Object.keys(task.exit_codes).forEach(exitCode => {
          if (routing[task.task_name][parseInt(exitCode)] === undefined) {
            newWarnings.push(`Exit code ${exitCode} for task "${task.task_name}" is not mapped.`);
          }
        });
      }
    });
    setWarnings(newWarnings);
    return newWarnings.length === 0;
  }, [routing, tasks]);

  useEffect(() => {
    validateRouting();
  }, [routing, validateRouting]);

  const handleTaskAdd = (taskName: string) => {
    setRouting(prev => ({
      ...prev,
      [taskName]: {},
    }));
  };

  const unusedTasks = tasks.filter(task => !routing[task.task_name]);

  const handleSaveRouting = () => {
    if (validateRouting()) {
      onChange(routing);
      addNotification('Routing saved successfully', 'success');
    } else {
      addNotification('Cannot save invalid routing', 'error');
    }
  };

  return (
    <Box>
      {warnings.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} className={classes.warningAlert}>
          <Typography variant="body1">Invalid Routing:</Typography>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}
      {Object.entries(routing).map(([taskName, routeMap]) => (
        <TaskRoutingDesign
          key={taskName}
          taskName={taskName}
          routeMap={routeMap}
          tasks={tasks}
          onChange={(newRouteMap) => setRouting(prev => ({ ...prev, [taskName]: newRouteMap }))}
          isViewMode={isViewMode}
        />
      ))}
      {!isViewMode && unusedTasks.length > 0 && (
        <Box mt={2}>
          <Select
            value=""
            onChange={(e) => handleTaskAdd(e.target.value as string)}
            displayEmpty
          >
            <MenuItem value="" disabled>Add a task</MenuItem>
            {unusedTasks.map(task => (
              <MenuItem key={task.task_name} value={task.task_name}>{task.task_name}</MenuItem>
            ))}
          </Select>
        </Box>
      )}
      {!isViewMode && (
        <Button 
          onClick={handleSaveRouting} 
          disabled={warnings.length > 0}
          className={classes.saveButton}
        >
          Save Routing
        </Button>
      )}
    </Box>
  );
};

interface TaskRoutingDesignProps {
  taskName: string;
  routeMap: RouteMap;
  tasks: AliceTask[];
  onChange: (newRouteMap: RouteMap) => void;
  isViewMode: boolean;
}

const TaskRoutingDesign: React.FC<TaskRoutingDesignProps> = ({
  taskName,
  routeMap,
  tasks,
  onChange,
  isViewMode,
}) => {
  const task = tasks.find(t => t.task_name === taskName);
  const classes = useStyles();

  if (!task) return null;

  return (
    <Box mt={2} className={classes.taskCard}>
      <Typography variant="subtitle1" fontWeight={'bold'}>{taskName}</Typography>
      <RouteMapView
        routeMap={routeMap}
        exitCodes={task.exit_codes}
        availableTasks={tasks.map(t => t.task_name)}
        onChange={onChange}
        isViewMode={isViewMode}
      />
    </Box>
  );
};

export default TaskEndCodeRoutingBuilder;