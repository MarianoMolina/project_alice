import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel
} from '@mui/material';
import BaseDbElement, { BaseDbElementProps } from '../BaseDbElement';
import { TaskResponse } from '../../utils/TaskResponseTypes';
import useStyles from './TaskResponseStyles';

type BaseTaskResultMode = BaseDbElementProps<TaskResponse>['mode'];
type ExtendedTaskResultMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedTaskResultMode = BaseTaskResultMode | ExtendedTaskResultMode;

interface EnhancedTaskResultProps {
  mode: EnhancedTaskResultMode;
  itemId?: string;
  isInteractable?: boolean;
  fetchAll: boolean;
  onInteraction?: (taskResult: TaskResponse) => void;
}

const EnhancedTaskResult: React.FC<EnhancedTaskResultProps> = (props) => {
  const classes = useStyles();
  const [orderBy, setOrderBy] = useState<keyof TaskResponse>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  console.log('enhanced task result props:', props);
  const handleRequestSort = useCallback((property: keyof TaskResponse) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [order, orderBy]);

  const sortItems = useCallback((items: TaskResponse[]) => {
    return [...items].sort((a, b) => {
      if (a[orderBy]! < b[orderBy]!) {
        return order === 'asc' ? -1 : 1;
      }
      if (a[orderBy]! > b[orderBy]!) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [order, orderBy]);

  const renderTaskResult = (taskResult: TaskResponse) => (
    <Paper elevation={3} sx={{ p: 2}}>
      <Typography variant="h6" gutterBottom>
        Task: {taskResult.task_name}
      </Typography>
      <Typography variant="body1">{taskResult.task_description}</Typography>
      <Typography variant="body2" color="textSecondary">
        Status: {taskResult.status}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Result Code: {taskResult.result_code}
      </Typography>
      {taskResult.task_outputs && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Outputs:
          </Typography>
          <Typography variant="body2">{JSON.stringify(taskResult.task_outputs)}</Typography>
        </Box>
      )}
      {taskResult.result_diagnostic && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Diagnostic:
          </Typography>
          <Typography variant="body2">{taskResult.result_diagnostic}</Typography>
        </Box>
      )}
      {taskResult.usage_metrics && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Usage Metrics:
          </Typography>
          <Typography variant="body2">{JSON.stringify(taskResult.usage_metrics)}</Typography>
        </Box>
      )}
    </Paper>
  );

  const renderViewMode = (
    items: TaskResponse[] | null,
    item: TaskResponse | null,
    onChange: (newItem: Partial<TaskResponse>) => void,
    mode: BaseTaskResultMode,
    handleSave: () => Promise<void>
  ) => {
    const renderSingleItem = (taskResult: TaskResponse) => {
      switch (props.mode) {
        case 'list':
        case 'shortList':
          return (
            <ListItem button onClick={() => props.onInteraction && props.onInteraction(taskResult)}>
              <ListItemText
                primary={taskResult.task_name}
                secondary={props.mode === 'list' ? `Status: ${taskResult.status}, Result Code: ${taskResult.result_code}` : undefined}
              />
            </ListItem>
          );
        case 'card':
        default:
          return renderTaskResult(taskResult);
      }
    };

    if (props.fetchAll && items) {
      const sortedItems = sortItems(items);

      if (props.mode === 'table') {
        return (
          <TableContainer component={Paper} className={classes.taskResultsTable}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'task_name'}
                      direction={orderBy === 'task_name' ? order : 'asc'}
                      onClick={() => handleRequestSort('task_name')}
                    >
                      Task Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'result_code'}
                      direction={orderBy === 'result_code' ? order : 'asc'}
                      onClick={() => handleRequestSort('result_code')}
                    >
                      Result Code
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'createdAt'}
                      direction={orderBy === 'createdAt' ? order : 'asc'}
                      onClick={() => handleRequestSort('createdAt')}
                    >
                      Created At
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedItems.map((result) => (
                  <TableRow
                    key={result._id}
                    onClick={() => props.onInteraction && props.onInteraction(result)}
                    className={classes.tableRow}
                  >
                    <TableCell>{result.task_name}</TableCell>
                    <TableCell>{result.result_code}</TableCell>
                    <TableCell>{result.createdAt ? new Date(result.createdAt).toLocaleString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      }
      return (
        <List>
          {sortedItems.map((taskResult) => (
            <Box key={taskResult._id}>
              {renderSingleItem(taskResult)}
            </Box>
          ))}
        </List>
      );
    } else if (item) {
      return renderSingleItem(item);
    } else {
      return <Typography>No task result data available.</Typography>;
    }
  };

  return (
    <BaseDbElement<TaskResponse>
      collectionName="taskresults"
      itemId={props.itemId}
      mode="view"
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      fetchAll={props.fetchAll}
      render={renderViewMode}
    />
  );
};

export default EnhancedTaskResult;