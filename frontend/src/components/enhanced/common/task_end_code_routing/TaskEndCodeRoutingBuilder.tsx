import React, { useEffect, useCallback, useState } from 'react';
import { Box, Typography, Select, MenuItem, Alert } from '@mui/material';
import { AliceTask, RouteMap, TasksEndCodeRouting } from '../../../../types/TaskTypes';
import RouteMapView from './RouteMapView';
import useStyles from './RoutingStyles';
import WarningIcon from '@mui/icons-material/Warning';
import Logger from '../../../../utils/Logger';

interface TaskEndCodeRoutingBuilderProps {
  tasks?: AliceTask[];
  routing: TasksEndCodeRouting;
  onChange: (routing: TasksEndCodeRouting) => void;
  isViewMode?: boolean;
}

const TaskEndCodeRoutingBuilder: React.FC<TaskEndCodeRoutingBuilderProps> = ({
  tasks,
  routing,
  onChange,
  isViewMode = false,
}) => {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const classes = useStyles();

  const isWorkflowMode = !!tasks && tasks.length > 0;
  const allNodeNames = Object.keys(routing);

  const validateRouting = useCallback(() => {
    if (!isWorkflowMode || isViewMode) return true;

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
  }, [routing, tasks, isViewMode, isWorkflowMode]);

  useEffect(() => {
    validateRouting();
  }, [routing, validateRouting]);

  const handleTaskAdd = (taskName: string) => {
    onChange({
      ...routing,
      [taskName]: {},
    });
    setSelectedTask('');
  };

  const handleRouteMapChange = (taskName: string, newRouteMap: RouteMap) => {
    onChange({
      ...routing,
      [taskName]: newRouteMap,
    });
  };

  const unusedTasks = isWorkflowMode 
    ? tasks.filter(task => !routing[task.task_name])
    : [];

  return (
    <Box className={classes.routingContainer}>
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
      {Object.entries(routing).map(([nodeName, routeMap]) => (
        <TaskRoutingDesign
          key={nodeName}
          nodeName={nodeName}
          routeMap={routeMap}
          tasks={tasks}
          availableNodes={allNodeNames}
          onChange={(newRouteMap) => handleRouteMapChange(nodeName, newRouteMap)}
          isViewMode={isViewMode}
          isWorkflowMode={isWorkflowMode}
        />
      ))}
      {!isViewMode && unusedTasks.length > 0 && (
        <Box mt={2}>
          <Select
            value={selectedTask}
            onChange={(e) => {
              const value = e.target.value as string;
              setSelectedTask(value);
              handleTaskAdd(value);
            }}
            displayEmpty
          >
            <MenuItem value="" disabled>Add a task</MenuItem>
            {unusedTasks.map(task => (
              <MenuItem key={task.task_name} value={task.task_name}>{task.task_name}</MenuItem>
            ))}
          </Select>
        </Box>
      )}
    </Box>
  );
};

interface TaskRoutingDesignProps {
  nodeName: string;
  routeMap: RouteMap;
  tasks?: AliceTask[];
  availableNodes: string[];
  onChange: (newRouteMap: RouteMap) => void;
  isViewMode: boolean;
  isWorkflowMode: boolean;
}

const TaskRoutingDesign: React.FC<TaskRoutingDesignProps> = ({
  nodeName,
  routeMap,
  tasks,
  availableNodes,
  onChange,
  isViewMode,
  isWorkflowMode,
}) => {
  const classes = useStyles();

  const task = isWorkflowMode 
    ? tasks?.find(t => t.task_name === nodeName)
    : null;

  // Convert routeMap exit codes to format expected by RouteMapView
  const exitCodesFromRouteMap = isWorkflowMode 
    ? (task?.exit_codes ?? {})
    : Object.keys(routeMap).reduce((acc, exitCode) => {
        acc[exitCode] = exitCode; // Use the exit code as its own description
        return acc;
      }, {} as Record<string, string>);

  if (isWorkflowMode && !task) return null;

  return (
    <Box mt={2} className={classes.taskCard}>
      <Typography variant="subtitle1" fontWeight={'bold'}>{nodeName}</Typography>
      <RouteMapView
        routeMap={routeMap}
        exitCodes={exitCodesFromRouteMap}
        availableTasks={isWorkflowMode ? tasks?.map(t => t.task_name) ?? [] : availableNodes}
        onChange={onChange}
        isViewMode={isViewMode}
      />
    </Box>
  );
};

export default TaskEndCodeRoutingBuilder;