import React from 'react';
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Button,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent
} from '@mui/material';
import { useConfig } from '../../context/ConfigContext';
import { AliceModel, Prompt } from '../../utils/Types';
import { AliceAgent } from '../../utils/AgentTypes';
import BaseDbElement, { BaseDbElementProps } from '../BaseDbElement';
import { getFieldId } from '../../utils/DBUtils';
import useStyles from './AgentStyles';

type BaseAgentMode = BaseDbElementProps<AliceAgent>['mode'];
type ExtendedAgentMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedAgentMode = BaseAgentMode | ExtendedAgentMode;

interface EnhancedAgentProps {
  mode: EnhancedAgentMode;
  itemId?: string;
  isInteractable?: boolean;
  fetchAll: boolean;
  onInteraction?: (agent: AliceAgent) => void;
  onSave?: (agent: AliceAgent) => void;
}

const EnhancedAgent: React.FC<EnhancedAgentProps> = (props) => {
  const classes = useStyles();
  const { prompts, models } = useConfig();

  const renderAgent = (
    items: AliceAgent[] | null,
    agent: AliceAgent | null,
    onChange: (newAgent: Partial<AliceAgent>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>
  ) => {
    const isEditMode = mode === 'edit' || mode === 'create';

    return (
      <Box>
        <TextField
          fullWidth
          label="Name"
          value={agent?.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          margin="normal"
          disabled={!isEditMode}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>System Message</InputLabel>
          <Select
            value={getFieldId(agent?.system_message)}
            onChange={(e) => onChange({ system_message: e.target.value as string })}
            disabled={!isEditMode}
          >
            {prompts.map((prompt: Prompt) => (
              <MenuItem key={prompt._id} value={prompt._id}>{prompt.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={agent?.code_execution_config || false}
              onChange={(e) => onChange({ code_execution_config: e.target.checked })}
              disabled={!isEditMode}
            />
          }
          label="Execute Code"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Model</InputLabel>
          <Select
            value={getFieldId(agent?.model)}
            onChange={(e) => onChange({ model: e.target.value as string })}
            disabled={!isEditMode}
          >
            {models.map((model: AliceModel) => (
              <MenuItem key={model._id} value={model._id}>{model.short_name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography gutterBottom>Temperature</Typography>
        <Slider
          value={parseFloat(agent?.llm_config?.temperature as string) || 0.7}
          onChange={(_, newValue) => onChange({ llm_config: { ...agent?.llm_config, temperature: newValue.toString() } })}
          min={0}
          max={1}
          step={0.1}
          disabled={!isEditMode}
        />
        <Typography gutterBottom>Timeout (seconds)</Typography>
        <Slider
          value={parseInt(agent?.llm_config?.timeout as string) || 300}
          onChange={(_, newValue) => onChange({ llm_config: { ...agent?.llm_config, timeout: newValue.toString() } })}
          min={30}
          max={600}
          step={30}
          disabled={!isEditMode}
        />
        {isEditMode && (
          <Button variant="contained" color="primary" onClick={handleSave}>
            {agent?._id ? 'Update Agent' : 'Create Agent'}
          </Button>
        )}
      </Box>
    );
  };

  const renderViewMode = (
    items: AliceAgent[] | null,
    item: AliceAgent | null,
    onChange: (newItem: Partial<AliceAgent>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>
  ) => {
    const renderSingleItem = (agent: AliceAgent) => {
      switch (props.mode) {
        case 'list':
        case 'shortList':
          return (
            <ListItem button onClick={() => props.onInteraction && props.onInteraction(agent)}>
              <ListItemText
                primary={agent.name}
                secondary={props.mode === 'list' ? `Model: ${getModelName(agent.model)}, Execute Code: ${agent.code_execution_config ? 'Yes' : 'No'}` : undefined}
              />
            </ListItem>
          );
        case 'table':
          return <Typography>Table view not implemented yet</Typography>;
        case 'card':
          return (
            <Card>
              <CardContent>
                <Typography variant="h6">{agent.name}</Typography>
                <Typography variant="body2">Model: {getModelName(agent.model)}</Typography>
                <Typography variant="body2">Execute Code: {agent.code_execution_config ? 'Yes' : 'No'}</Typography>
              </CardContent>
            </Card>
          );
        default:
          return renderAgent([agent], agent, onChange, 'view', handleSave);
      }
    };

    if (props.fetchAll && items) {
      return (
        <List>
          {items.map((agent) => (
            <Box key={agent._id}>
              {renderSingleItem(agent)}
            </Box>
          ))}
        </List>
      );
    } else if (item) {
      return renderSingleItem(item);
    } else {
      return <Typography>No agent data available.</Typography>;
    }
  };

  const getModelName = (modelId: string | AliceModel | null | undefined): string => {
    if (typeof modelId === 'string') {
      const model = models.find(m => m._id === modelId);
      return model ? model.short_name : 'Unknown Model';
    } else if (modelId && typeof modelId === 'object' && 'short_name' in modelId) {
      return modelId.short_name;
    }
    return 'No Model Selected';
  };

  const baseDbMode: BaseDbElementProps<AliceAgent>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<AliceAgent>
      collectionName="agents"
      itemId={props.itemId}
      mode={baseDbMode}
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      fetchAll={props.fetchAll}
      render={['list', 'shortList', 'card', 'table'].includes(props.mode)
        ? renderViewMode
        : renderAgent}
    />
  );
};

export default EnhancedAgent;