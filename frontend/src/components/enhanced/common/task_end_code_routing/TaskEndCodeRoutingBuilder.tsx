import React, { useEffect, useCallback, useState } from 'react';
import { Box, Typography, Select, MenuItem, Alert, IconButton, Tooltip, FormControl } from '@mui/material';
import { AliceTask, RouteMap, TasksEndCodeRouting, TaskType } from '../../../../types/TaskTypes';
import RouteMapView from './RouteMapView';
import useStyles from './RoutingStyles';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import { SelectInput } from '../../common/inputs/SelectInput';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { NODE_CONFIGS } from '../task_flowchart/nodes/shared_nodes/TaskTypeNodeDefinitions';
import theme from '../../../../Theme';

interface TaskEndCodeRoutingBuilderProps {
  title?: string | undefined;
  tasks?: AliceTask[];
  routing: TasksEndCodeRouting;
  onChange: (routing: TasksEndCodeRouting) => void;
  onChangeStartNode: (nodeName: string | null) => void;
  startNode?: string | null;
  isViewMode?: boolean;
  taskType?: TaskType;
}

const TaskEndCodeRoutingBuilder: React.FC<TaskEndCodeRoutingBuilderProps> = ({
  title = "Task End Code Routing",
  tasks,
  routing,
  onChange,
  onChangeStartNode,
  startNode,
  isViewMode = false,
  taskType = TaskType.Workflow
}) => {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const classes = useStyles();

  const getAvailableNodes = useCallback(() => {
    if (taskType === TaskType.Workflow) {
      return tasks?.map(task => task.task_name) || [];
    }
    return NODE_CONFIGS[taskType] ? Object.keys(NODE_CONFIGS[taskType]) : [];
  }, [taskType, tasks]);

  const validateRouting = useCallback(() => {
    const newWarnings: string[] = [];
    const availableNodes = getAvailableNodes();

    if (!startNode) {
      newWarnings.push('No start node selected.');
    } else if (!availableNodes.includes(startNode)) {
      newWarnings.push(`Selected start node "${startNode}" is not available.`);
    }

    if (taskType === TaskType.Workflow) {
      if (!tasks || tasks.length === 0) {
        newWarnings.push('No tasks available for routing.');
        setWarnings(newWarnings);
        return true;
      }

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
    } else {
      const configNodes = Object.keys(NODE_CONFIGS[taskType] || {});
      configNodes.forEach(nodeName => {
        if (!routing[nodeName]) {
          newWarnings.push(`Node "${nodeName}" is available but not used in the routing.`);
        }
      });
    }

    Object.entries(routing).forEach(([nodeName, routeMap]) => {
      Object.entries(routeMap).forEach(([exitCode, [targetNode]]) => {
        if (targetNode && !availableNodes.includes(targetNode) && targetNode !== 'End') {
          newWarnings.push(`Invalid routing target "${targetNode}" from node "${nodeName}" (exit code ${exitCode}).`);
        }
      });
    });

    setWarnings(newWarnings);
    return newWarnings.length === 0;
  }, [routing, tasks, taskType, getAvailableNodes, startNode]);

  useEffect(() => {
    validateRouting();
  }, [routing, validateRouting]);

  const handleNodeAdd = (nodeName: string) => {
    onChange({
      ...routing,
      [nodeName]: {},
    });
    setSelectedNode('');
  };

  const handleNodeRemove = (nodeName: string) => {
    const { [nodeName]: removed, ...newRouting } = routing;

    if (startNode === nodeName) {
      onChangeStartNode(null);
    }

    Object.entries(newRouting).forEach(([currentNode, routeMap]) => {
      Object.entries(routeMap).forEach(([exitCode, [targetNode, retry]]) => {
        if (targetNode === nodeName) {
          newRouting[currentNode] = {
            ...newRouting[currentNode],
            [exitCode]: [null, retry]
          };
        }
      });
    });

    onChange(newRouting);
  };

  const handleRouteMapChange = (nodeName: string, newRouteMap: RouteMap) => {
    onChange({
      ...routing,
      [nodeName]: newRouteMap,
    });
  };

  const getNodeExitCodes = (nodeName: string) => {
    if (taskType === TaskType.Workflow) {
      const task = tasks?.find(t => t.task_name === nodeName);
      return task?.exit_codes || {};
    }
    return { 0: "Success", 1: "Failure" };
  };

  const unusedNodes = getAvailableNodes()
    .filter(nodeName => !routing[nodeName]);

  const availableNodes = getAvailableNodes();
  const startNodeOptions = [
    { value: '', label: 'None' },
    ...availableNodes.map(node => ({
      value: node,
      label: formatCamelCaseString(node)
    }))
  ];

  return (
    <Box 
      sx={{ 
        mt: 1, 
        mb: 1,
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        position: 'relative'
      }}
    >
      {/* Title */}
      <Typography
        variant="h6"
        sx={{
          position: 'absolute',
          top: -12,
          left: 16,
          px: 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary
        }}
      >
        {title}
      </Typography>

      {/* Start Node Selection */}
      <Box sx={{ mt: 2 }}>
        <SelectInput
          name="start_node"
          label="Start Node"
          value={startNode || ''}
          onChange={(value) => onChangeStartNode(value as string || null)}
          disabled={isViewMode}
          description="Select the node that will be executed first"
          options={startNodeOptions}
          required
        />
      </Box>

      {/* Warnings Display */}
      {warnings.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} className={classes.warningAlert}>
          <Typography variant="body1">Routing Warnings:</Typography>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Routing Nodes */}
      <Box className={classes.routingContainer}>
        {Object.entries(routing).map(([nodeName, routeMap]) => (
          <Box key={nodeName} sx={{ mt: 2 }}>
            <Box className={classes.taskCard}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1
              }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatCamelCaseString(nodeName)}
                </Typography>
                {!isViewMode && (
                  <Tooltip title="Remove node">
                    <IconButton
                      size="small"
                      onClick={() => handleNodeRemove(nodeName)}
                      sx={{
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'error.light',
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <RouteMapView
                routeMap={routeMap}
                exitCodes={getNodeExitCodes(nodeName)}
                availableTasks={getAvailableNodes()}
                onChange={(newRouteMap) => handleRouteMapChange(nodeName, newRouteMap)}
                isViewMode={isViewMode}
              />
            </Box>
          </Box>
        ))}
      </Box>

      {/* Add New Node Selection */}
      {!isViewMode && unusedNodes.length > 0 && (
        <FormControl fullWidth sx={{ mt: 2 }}>
          <Select
            value={selectedNode}
            onChange={(e) => {
              const value = e.target.value as string;
              setSelectedNode(value);
              handleNodeAdd(value);
            }}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Add a {taskType === TaskType.Workflow ? 'task' : 'node'}
            </MenuItem>
            {unusedNodes.map(node => (
              <MenuItem key={node} value={node}>
                {formatCamelCaseString(node)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

export default TaskEndCodeRoutingBuilder;