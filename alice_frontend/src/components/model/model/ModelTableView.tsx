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
import { ModelComponentProps } from '../../../utils/ModelTypes';

const ModelTableView: React.FC<ModelComponentProps> = ({
  items,
  isInteractable = false,
  onInteraction,
  showHeaders = true,
}) => {
  if (!items) return null;

  return (
    <TableContainer component={Paper}>
      <Table>
        {showHeaders && (
          <TableHead>
            <TableRow>
              <TableCell>Model Name</TableCell>
              <TableCell>Deployment</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {items.map((model) => (
            <TableRow key={model._id}>
              <TableCell>{model.model_name}</TableCell>
              <TableCell>{model.deployment || 'N/A'}</TableCell>
              <TableCell>{new Date(model.createdAt || '').toLocaleString()}</TableCell>
              <TableCell>
                {isInteractable && onInteraction && (
                  <Tooltip title="View Task">
                    <IconButton onClick={() => onInteraction(model)}>
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

export default ModelTableView;