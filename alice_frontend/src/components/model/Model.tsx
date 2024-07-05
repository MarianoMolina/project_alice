import React from 'react';
import { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Button, List, ListItem, ListItemText, Card, CardContent } from '@mui/material';
import BaseDbElement, { BaseDbElementProps } from '../BaseDbElement';
import useStyles from './ModelStyles';
import { AliceModel } from '../../utils/Types';

type BaseModelMode = BaseDbElementProps<AliceModel>['mode'];
type ExtendedModelMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedModelMode = BaseModelMode | ExtendedModelMode;

interface EnhancedModelProps {
  mode: EnhancedModelMode;
  itemId?: string;
  isInteractable?: boolean;
  fetchAll: boolean;
  onInteraction?: (model: AliceModel) => void;
  onSave?: (model: AliceModel) => void;
}

const EnhancedModel: React.FC<EnhancedModelProps> = (props) => {
  const classes = useStyles();

  const renderModel = (
    items: AliceModel[] | null,
    model: AliceModel | null,
    onChange: (newItem: Partial<AliceModel>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>
  ) => {
    const isEditMode = mode === 'edit' || mode === 'create';

    return (
      <Box>
        <TextField
          fullWidth
          label="Short Name"
          value={model?.short_name || ''}
          onChange={(e) => onChange({ short_name: e.target.value })}
          margin="normal"
          disabled={!isEditMode}
        />
        <TextField
          fullWidth
          label="Model Name"
          value={model?.model_name || ''}
          onChange={(e) => onChange({ model_name: e.target.value })}
          margin="normal"
          disabled={!isEditMode}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Model Type</InputLabel>
          <Select
            value={model?.model_type || 'chat'}
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
            value={model?.deployment || 'local'}
            onChange={(e) => onChange({ deployment: e.target.value as 'local' | 'remote' })}
            disabled={!isEditMode}
          >
            <MenuItem value="local">Local</MenuItem>
            <MenuItem value="remote">Remote</MenuItem>
          </Select>
        </FormControl>
        {model?.deployment === 'local' && (
          <TextField
            fullWidth
            label="File Name"
            value={model?.model_file || ''}
            onChange={(e) => onChange({ model_file: e.target.value })}
            margin="normal"
            disabled={!isEditMode}
          />
        )}
        <TextField
          fullWidth
          label="API Key"
          value={model?.api_key || ''}
          onChange={(e) => onChange({ api_key: e.target.value })}
          margin="normal"
          disabled={!isEditMode}
        />
        {model?.deployment === 'local' && (
          <TextField
            fullWidth
            label="Port"
            type="number"
            value={model?.port || 1234}
            onChange={(e) => onChange({ port: parseInt(e.target.value) })}
            margin="normal"
            disabled={!isEditMode}
          />
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel>API Type</InputLabel>
          <Select
            value={model?.api_type || 'openai'}
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
          value={model?.base_url || ''}
          onChange={(e) => onChange({ base_url: e.target.value })}
          margin="normal"
          disabled={!isEditMode}
        />
        <TextField
          fullWidth
          label="Autogen Model Client Class"
          value={model?.autogen_model_client_cls || ''}
          onChange={(e) => onChange({ autogen_model_client_cls: e.target.value })}
          margin="normal"
          disabled={!isEditMode}
        />
        {isEditMode && (
          <Button variant="contained" color="primary" onClick={handleSave}>
            {model?._id ? 'Update Model' : 'Create Model'}
          </Button>
        )}
      </Box>
    );
  };

  const renderViewMode = (
    items: AliceModel[] | null,
    item: AliceModel | null,
    onChange: (newItem: Partial<AliceModel>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>
  ) => {
    const renderSingleItem = (model: AliceModel) => {
      switch (props.mode) {
        case 'list':
        case 'shortList':
          return (
            <ListItem button onClick={() => props.isInteractable && props.onInteraction && props.onInteraction(model)}>
              <ListItemText
                primary={model.short_name}
                secondary={props.mode === 'list' ? `Model: ${model.model_name}, Type: ${model.model_type}, Deployment: ${model.deployment}` : undefined}
              />
            </ListItem>
          );
        case 'table':
          return <Typography>Table view not implemented yet</Typography>;
        case 'card':
          return (
            <Card>
              <CardContent>
                <Typography variant="h6">{model.short_name}</Typography>
              </CardContent>
            </Card>
          );
        default:
          return renderModel([model], model, onChange, 'view', handleSave);
      }
    };

    if (props.fetchAll && items) {
      return (
        <List>
          {items.map((model) => (
            <Box key={model._id}>
              {renderSingleItem(model)}
            </Box>
          ))}
        </List>
      );
    } else if (item) {
      return renderSingleItem(item);
    } else {
      return <Typography>No model data available.</Typography>;
    }
  };

  const baseDbMode: BaseDbElementProps<AliceModel>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<AliceModel>
      collectionName="models"
      itemId={props.itemId}
      mode={baseDbMode}
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      fetchAll={props.fetchAll}
      render={['list', 'shortList', 'card', 'table'].includes(props.mode)
        ? renderViewMode
        : renderModel}
    />
  );
};

export default EnhancedModel;