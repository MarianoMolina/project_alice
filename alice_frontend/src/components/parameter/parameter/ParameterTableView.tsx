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
import { ParameterComponentProps } from '../../../utils/ParameterTypes';

const ParameterTableView: React.FC<ParameterComponentProps> = ({
  items,
  isInteractable = false,
  onView,
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
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {items.map((parameter) => (
            <TableRow key={parameter._id}>
              <TableCell>{parameter.description}</TableCell>
              <TableCell>{parameter.type || 'N/A'}</TableCell>
              <TableCell>{new Date(parameter.createdAt || '').toLocaleString()}</TableCell>
              <TableCell>
                {onView && (
                  <Tooltip title="View Task">
                    <IconButton onClick={() => onView(parameter)}>
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

export default ParameterTableView;