import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Switch, 
    FormControlLabel
} from '@mui/material';
import FunctionDefinitionBuilder from '../../parameter/Function';
import { PromptComponentProps } from '../../../utils/PromptTypes';

const PromptFlexibleView: React.FC<PromptComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {

    if (!item) {
        return <Typography>No Prompt data available.</Typography>;
    }
    const isEditMode = mode === 'edit' || mode === 'create';
    console.log('PromptFlexibleView item:', item)
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
                onChange={(functionDefinition) => onChange({ ...item, parameters: functionDefinition })}
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

export default PromptFlexibleView;