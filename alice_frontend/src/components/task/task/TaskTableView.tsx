import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility, ChevronRight } from '@mui/icons-material';
import { TaskComponentProps } from '../../../utils/TaskTypes';

const TaskTableView: React.FC<TaskComponentProps> = ({
  items,
  isInteractable = false,
  onInteraction,
  onAddTask,
  showHeaders = true,
}) => {
  if (!items) return null;

  return (
    <TableContainer component={Paper}>
      <Table>
        {showHeaders && (
          <TableHead>
            <TableRow>
              <TableCell>Task Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {items.map((task) => (
            <TableRow key={task._id}>
              <TableCell>{task.task_name}</TableCell>
              <TableCell>{task.task_description || 'N/A'}</TableCell>
              <TableCell>{new Date(task.createdAt || '').toLocaleString()}</TableCell>
              <TableCell>
                {onInteraction && (
                  <Tooltip title="View Task">
                    <IconButton onClick={() => onInteraction(task)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                )}
                {onAddTask && (
                  <Tooltip title="Add Task">
                    <IconButton onClick={() => onAddTask(task)}>
                      <ChevronRight />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TaskTableView;