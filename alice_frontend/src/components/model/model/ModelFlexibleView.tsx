import React from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
} from '@mui/material';
import { ModelComponentProps } from '../../../utils/ModelTypes';

const ModelFlexibleView: React.FC<ModelComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {

    if (!item) {
        return <Typography>No Model data available.</Typography>;
    }
    const isEditMode = mode === 'edit' || mode === 'create';

    return (
        <Box>
          <TextField
            fullWidth
            label="Short Name"
            value={item?.short_name || ''}
            onChange={(e) => onChange({ short_name: e.target.value })}
            margin="normal"
            disabled={!isEditMode}
          />
          <TextField
            fullWidth
            label="Model Name"
            value={item?.model || ''}
            onChange={(e) => onChange({ model: e.target.value })}
            margin="normal"
            disabled={!isEditMode}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Model Type</InputLabel>
            <Select
              value={item?.model_type || 'chat'}
              onChange={(e) => onChange({ model_type: e.target.value as 'instruct' | 'chat' | 'vision' })}
              disabled={!isEditMode}
            >
              <MenuItem value="chat">Chat</MenuItem>
              <MenuItem value="instruct">Instruct</MenuItem>
              <MenuItem value="vision">Vision</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Deployment</InputLabel>
            <Select
              value={item?.deployment || 'local'}
              onChange={(e) => onChange({ deployment: e.target.value as 'local' | 'remote' })}
              disabled={!isEditMode}
            >
              <MenuItem value="local">Local</MenuItem>
              <MenuItem value="remote">Remote</MenuItem>
            </Select>
          </FormControl>
          {item?.deployment === 'local' && (
            <TextField
              fullWidth
              label="File Name"
              value={item?.model_file || ''}
              onChange={(e) => onChange({ model_file: e.target.value })}
              margin="normal"
              disabled={!isEditMode}
            />
          )}
          <TextField
            fullWidth
            label="API Key"
            value={item?.api_key || ''}
            onChange={(e) => onChange({ api_key: e.target.value })}
            margin="normal"
            disabled={!isEditMode}
          />
          {item?.deployment === 'local' && (
            <TextField
              fullWidth
              label="Port"
              type="number"
              value={item?.port || 1234}
              onChange={(e) => onChange({ port: parseInt(e.target.value) })}
              margin="normal"
              disabled={!isEditMode}
            />
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel>API Type</InputLabel>
            <Select
              value={item?.api_type || 'openai'}
              onChange={(e) => onChange({ api_type: e.target.value as 'openai' | 'azure' | 'anthropic' })}
              disabled={!isEditMode}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="azure">Azure</MenuItem>
              <MenuItem value="anthropic">Anthropic</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Base URL"
            value={item?.base_url || ''}
            onChange={(e) => onChange({ base_url: e.target.value })}
            margin="normal"
            disabled={!isEditMode}
          />
          <TextField
            fullWidth
            label="Autogen Model Client Class"
            value={item?.autogen_model_client_cls || ''}
            onChange={(e) => onChange({ autogen_model_client_cls: e.target.value })}
            margin="normal"
            disabled={!isEditMode}
          />
          {isEditMode && (
            <Button variant="contained" color="primary" onClick={handleSave}>
              {item?._id ? 'Update Model' : 'Create Model'}
            </Button>
          )}
        </Box>
    );
};

export default ModelFlexibleView;