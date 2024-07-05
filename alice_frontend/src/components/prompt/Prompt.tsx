import React from 'react';
import {
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent
} from '@mui/material';
import BaseDbElement, { BaseDbElementProps } from '../BaseDbElement';
import { Prompt, FunctionParameters } from '../../utils/Types';
import FunctionDefinitionBuilder from '../parameter/Function';

type BasePromptMode = BaseDbElementProps<Prompt>['mode'];
type ExtendedPromptMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedPromptMode = BasePromptMode | ExtendedPromptMode;

interface EnhancedPromptProps {
  mode: EnhancedPromptMode;
  itemId?: string;
  isInteractable?: boolean;
  fetchAll: boolean;
  onInteraction?: (prompt: Prompt) => void;
  onSave?: (prompt: Prompt) => void;
}

const EnhancedPrompt: React.FC<EnhancedPromptProps> = (props) => {
  const renderPrompt = (
    items: Prompt[] | null,
    item: Prompt | null,
    onChange: (newPrompt: Partial<Prompt>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>
  ) => {
    const isEditMode = mode === 'edit' || mode === 'create';

    const handleFunctionDefinitionChange = (functionDefinition: FunctionParameters) => {
      onChange({ ...item, parameters: functionDefinition });
    };

    return (
      <Box>
        <TextField
          fullWidth
          label="Name"
          value={item?.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          margin="normal"
          disabled={!isEditMode}
        />
        <TextField
          fullWidth
          label="Content"
          value={item?.content || ''}
          onChange={(e) => onChange({ content: e.target.value })}
          margin="normal"
          multiline
          rows={4}
          disabled={!isEditMode}
        />
        <FormControlLabel
          control={
            <Switch
              checked={item?.is_templated || false}
              onChange={(e) => onChange({ is_templated: e.target.checked })}
              disabled={!isEditMode}
            />
          }
          label="Is Templated"
        />
        {item?.is_templated && (
          <Box>
            <Typography gutterBottom>Parameters</Typography>
            <FunctionDefinitionBuilder
              initialParameters={item.parameters}
              onChange={handleFunctionDefinitionChange}
              isViewOnly={!isEditMode}
            />
          </Box>
        )}
        {isEditMode && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
          >
            {item?._id ? 'Update Prompt' : 'Create Prompt'}
          </Button>
        )}
      </Box>
    );
  };

  const renderViewMode = (
    items: Prompt[] | null,
    item: Prompt | null,
    onChange: (newItem: Partial<Prompt>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>
  ) => {
    const renderSingleItem = (prompt: Prompt) => {
      switch (props.mode) {
        case 'list':
        case 'shortList':
          return (
            <ListItem button onClick={() => props.onInteraction && props.onInteraction(prompt)}>
              <ListItemText
                primary={prompt.name}
                secondary={
                  props.mode === 'list' ? `Version: ${prompt.version}, Templated: ${prompt.is_templated ? 'Yes' : 'No'}` : undefined
                }
              />
            </ListItem>
          );
        case 'table':
          return <Typography>Table view not implemented yet</Typography>;
        case 'card':
          return (
            <Card>
              <CardContent>
                <Typography variant="h6">{prompt.name}</Typography>
                <Typography variant="body2">Version: {prompt.version}</Typography>
                <Typography variant="body2">Templated: {prompt.is_templated ? 'Yes' : 'No'}</Typography>
              </CardContent>
            </Card>
          );
        default:
          return renderPrompt([prompt], prompt, onChange, 'view', handleSave);
      }
    };

    if (props.fetchAll && items) {
      return (
        <List>
          {items.map((prompt) => (
            <Box key={prompt._id}>{renderSingleItem(prompt)}</Box>
          ))}
        </List>
      );
    } else if (item) {
      return renderSingleItem(item);
    } else {
      return <Typography>No prompt data available.</Typography>;
    }
  };

  const baseDbMode: BaseDbElementProps<Prompt>['mode'] =
    props.mode === 'create' ? 'create' : props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<Prompt>
      collectionName="prompts"
      itemId={props.itemId}
      mode={baseDbMode}
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      fetchAll={props.fetchAll}
      render={['list', 'shortList', 'card', 'table'].includes(props.mode) ? renderViewMode : renderPrompt}
    />
  );
};

export default EnhancedPrompt;