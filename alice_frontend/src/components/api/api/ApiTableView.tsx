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
  Tooltip,
  Switch,
} from '@mui/material';
import { Visibility, Edit } from '@mui/icons-material';
import { ApiComponentProps } from '../../../utils/ApiTypes';
import { API } from '../../../utils/ApiTypes';
const ApiTableView: React.FC<ApiComponentProps> = ({
  items,
  isInteractable = false,
  onInteraction,
  onView,
  onChange,
  showHeaders = true,
}) => {
  if (!items) return null;

  const handleToggleActive = (api: API) => {
    if (onChange) {
      onChange({ ...api, is_active: !api.is_active });
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        {showHeaders && (
          <TableHead>
            <TableRow>
              <TableCell>API Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {items.map((api) => (
            <TableRow key={api._id}>
              <TableCell>{api.name}</TableCell>
              <TableCell>{api.api_type}</TableCell>
              <TableCell>{api.health_status}</TableCell>
              <TableCell>
                <Switch
                  checked={api.is_active}
                  onChange={() => handleToggleActive(api)}
                  color="primary"
                />
              </TableCell>
              <TableCell>
                {onView && (
                  <Tooltip title="View API">
                    <IconButton onClick={() => onView(api)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                )}
                {onInteraction && (
                  <Tooltip title="Edit API">
                    <IconButton onClick={() => onInteraction(api)}>
                      <Edit />
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

export default ApiTableView;