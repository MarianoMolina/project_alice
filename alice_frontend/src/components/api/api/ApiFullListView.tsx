import React, { useState } from 'react';
import {
  List,
  ListItem,
  TextField,
  Switch,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { Save, Cancel, Edit } from '@mui/icons-material';
import { API, ApiType } from '../../../utils/ApiTypes';
import { ApiComponentProps } from '../../../utils/ApiTypes';

const ApiFullListView: React.FC<ApiComponentProps> = ({
  items,
  onChange,
  handleSave,
  onView,
  onInteraction,
}) => {
  const [editingApiId, setEditingApiId] = useState<string | null>(null);

  const handleApiUpdate = (api: API, updatedFields: Partial<API>) => {
    onChange({ ...api, ...updatedFields });
  };

  const handleApiConfigChange = (api: API, key: string, value: string) => {
    handleApiUpdate(api, {
      api_config: {
        ...api.api_config,
        [key]: value
      }
    });
  };

  const handleEdit = (api: API) => {
    setEditingApiId(api._id || null);
    if (onInteraction) {
      onInteraction(api);
    }
  };

  const handleCancel = () => {
    setEditingApiId(null);
  };

  const handleSaveApi = async (api: API) => {
    await handleSave();
    setEditingApiId(null);
  };

  if (!items) return null;

  return (
    <Box>
      <List>
        {items.map((api) => (
          <ListItem key={api._id} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{api.name}</Typography>
              {editingApiId === api._id ? (
                <Box>
                  <IconButton onClick={() => handleSaveApi(api)}>
                    <Save />
                  </IconButton>
                  <IconButton onClick={handleCancel}>
                    <Cancel />
                  </IconButton>
                </Box>
              ) : (
                <IconButton onClick={() => handleEdit(api)}>
                  <Edit />
                </IconButton>
              )}
            </Box>
            {editingApiId === api._id ? (
              <Box width="100%">
                <TextField
                  fullWidth
                  margin="normal"
                  label="API Name"
                  value={api.name}
                  onChange={(e) => handleApiUpdate(api, { name: e.target.value })}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>API Type</InputLabel>
                  <Select
                    value={api.api_type}
                    onChange={(e) => handleApiUpdate(api, { api_type: e.target.value as ApiType })}
                  >
                    {Object.values(ApiType).map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {Object.entries(api.api_config).map(([key, value]) => (
                  <TextField
                    key={key}
                    fullWidth
                    margin="normal"
                    label={key}
                    type="password"
                    value={value}
                    onChange={(e) => handleApiConfigChange(api, key, e.target.value)}
                  />
                ))}
                <Box display="flex" alignItems="center" margin="normal">
                  <Typography>Active</Typography>
                  <Switch
                    checked={api.is_active}
                    onChange={(e) => handleApiUpdate(api, { is_active: e.target.checked })}
                  />
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography>Type: {api.api_type}</Typography>
                <Typography>Status: {api.health_status}</Typography>
                <Typography>Active: {api.is_active ? 'Yes' : 'No'}</Typography>
                <Typography>Config Keys: {Object.keys(api.api_config).join(', ')}</Typography>
              </Box>
            )}
            {onView && (
              <Button onClick={() => onView(api)}>View Details</Button>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ApiFullListView;