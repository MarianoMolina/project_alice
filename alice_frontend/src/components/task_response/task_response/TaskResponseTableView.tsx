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
import { Visibility } from '@mui/icons-material';
import { TaskResponseComponentProps } from '../../../utils/TaskResponseTypes';

const TaskResponseTableView: React.FC<TaskResponseComponentProps> = ({
  items,
  isInteractable = false,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  if (!items) return null;

  return (
    <TableContainer component={Paper}>
      <Table>
        {showHeaders && (
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {items.map((taskResponse) => (
            <TableRow key={taskResponse._id}>
              <TableCell>{taskResponse.task_name}</TableCell>
              <TableCell>{taskResponse.status || 'N/A'}</TableCell>
              <TableCell>{new Date(taskResponse.createdAt || '').toLocaleString()}</TableCell>
              <TableCell>
                {onView && (
                  <Tooltip title="View Task">
                    <IconButton onClick={() => onView(taskResponse)}>
                      <Visibility />
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

export default TaskResponseTableView;