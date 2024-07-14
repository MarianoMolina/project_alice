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
import { PromptComponentProps } from '../../../utils/PromptTypes';

const PromptTableView: React.FC<PromptComponentProps> = ({
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
              <TableCell>Name</TableCell>
              <TableCell>Templated</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {items.map((prompt) => (
            <TableRow key={prompt._id}>
              <TableCell>{prompt.name}</TableCell>
              <TableCell>{prompt.is_templated}</TableCell>
              <TableCell>{new Date(prompt.createdAt || '').toLocaleString()}</TableCell>
              <TableCell>
                {onView && (
                  <Tooltip title="View Task">
                    <IconButton onClick={() => onView(prompt)}>
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

export default PromptTableView;