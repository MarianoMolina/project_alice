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
import { AgentComponentProps } from '../../../utils/AgentTypes';

const AgentTableView: React.FC<AgentComponentProps> = ({
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
              <TableCell>Agent Name</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {items.map((agent) => (
            <TableRow key={agent._id}>
              <TableCell>{agent.name}</TableCell>
              <TableCell>{new Date(agent.createdAt || '').toLocaleString()}</TableCell>
              <TableCell>
                {onView && (
                  <Tooltip title="View Task">
                    <IconButton onClick={() => onView(agent)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                )}
                {onInteraction && (
                  <Tooltip title="Add Task">
                    <IconButton onClick={() => onInteraction(agent)}>
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

export default AgentTableView;