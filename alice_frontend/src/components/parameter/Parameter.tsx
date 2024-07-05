import React, { useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  ListItemButton
} from '@mui/material';
import { ParameterDefinition } from '../../utils/Types';
import BaseDbElement, { BaseDbElementProps } from '../BaseDbElement';

type BaseParameterMode = BaseDbElementProps<ParameterDefinition>['mode'];
type ExtendedParameterMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedParameterMode = BaseParameterMode | ExtendedParameterMode;

interface EnhancedParameterProps {
  mode: EnhancedParameterMode;
  itemId?: string;
  isInteractable?: boolean;
  fetchAll: boolean;
  onInteraction?: (parameter: ParameterDefinition) => void;
  onSave?: (parameter: ParameterDefinition) => void;
}

const EnhancedParameter: React.FC<EnhancedParameterProps> = React.memo((props) => {

  const handleInteraction = useCallback((parameter: ParameterDefinition, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    props.onInteraction && props.onInteraction(parameter);
  }, [props]);

  const renderParameter = useCallback((
    items: ParameterDefinition[] | null,
    parameter: ParameterDefinition | null,
    onChange: (newParameter: Partial<ParameterDefinition>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>
  ) => {
    const isEditMode = mode === 'edit' || mode === 'create';

    if (mode === 'create' && (!parameter || !parameter.type)) {
      onChange({ type: 'string' });
    }

    return (
      <Box>
        <FormControl fullWidth margin="normal">
          <InputLabel>Type</InputLabel>
          <Select
            value={parameter?.type || 'string'}
            onChange={(e) => onChange({ type: e.target.value as 'string' | 'number' })}
            disabled={!isEditMode}
          >
            <MenuItem value="string">String</MenuItem>
            <MenuItem value="number">Number</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Description"
          value={parameter?.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          margin="normal"
          disabled={!isEditMode}
        />
        <TextField
          fullWidth
          label="Default Value"
          value={parameter?.default || ''}
          onChange={(e) => onChange({ default: parameter?.type === 'number' ? Number(e.target.value) : e.target.value })}
          type={parameter?.type === 'number' ? 'number' : 'text'}
          margin="normal"
          disabled={!isEditMode}
        />
        {isEditMode && (
          <Button variant="contained" color="primary" onClick={handleSave}>
            {parameter?._id ? 'Update Parameter' : 'Create Parameter'}
          </Button>
        )}
      </Box>
    );
  }, []);

  const renderViewMode = useCallback((
    items: ParameterDefinition[] | null,
    item: ParameterDefinition | null,
    onChange: (newItem: Partial<ParameterDefinition>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>
  ) => {
    const renderSingleItem = (parameter: ParameterDefinition) => {
      switch (props.mode) {
        case 'list':
        case 'shortList':
          return (
            <ListItemButton onClick={(event) => handleInteraction(parameter, event)}>
              <ListItemText
                primary={parameter.type}
                secondary={props.mode === 'list' ? parameter.description : undefined}
              />
            </ListItemButton>
          );
        case 'table':
          return <Typography>Table view not implemented yet</Typography>;
        case 'card':
          return (
            <Card>
              <CardContent>
                <Typography variant="h6">{parameter.type}</Typography>
                <Typography variant="body2">Description: {parameter.description}</Typography>
                <Typography variant="body2">Default: {parameter.default}</Typography>
              </CardContent>
            </Card>
          );
        default:
          return renderParameter([parameter], parameter, onChange, 'view', handleSave);
      }
    };

    if (props.fetchAll && items) {
      return (
        <List>
          {items.map((parameter) => (
            <ListItem key={parameter._id}>
              {renderSingleItem(parameter)}
            </ListItem>
          ))}
        </List>
      );
    } else if (item) {
      return renderSingleItem(item);
    } else {
      return <Typography>No parameter data available.</Typography>;
    }
  }, [props.mode, props.fetchAll, handleInteraction, renderParameter]);

  const baseDbMode = useMemo<BaseDbElementProps<ParameterDefinition>['mode']>(() => 
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view'
  , [props.mode]);

  return (
    <BaseDbElement<ParameterDefinition>
      collectionName="parameters"
      itemId={props.itemId}
      mode={baseDbMode}
      isInteractable={props.isInteractable}
      onInteraction={(parameter) => handleInteraction(parameter, {} as React.MouseEvent)}
      onSave={props.onSave}
      fetchAll={props.fetchAll}
      render={['list', 'shortList', 'card', 'table'].includes(props.mode)
        ? renderViewMode
        : renderParameter}
    />
  );
});

export default EnhancedParameter;