import React from 'react';
import {
    Typography,
    TextField,
    Switch,
    FormControlLabel,
    Box
} from '@mui/material';
import FunctionDefinitionBuilder from '../../common/function_select/Function';
import { PromptComponentProps } from '../../../../types/PromptTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';

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

    const title = mode === 'create' ? 'Create New Prompt' : mode === 'edit' ? 'Edit Prompt' : 'Prompt Details';
    const saveButtonText = item._id ? 'Update Prompt' : 'Create Prompt';

    return (
        <GenericFlexibleView
            title={title}
            onSave={handleSave}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
        >
            <TextField
                fullWidth
                label="Name"
                value={item.name || ''}
                onChange={(e) => onChange({ name: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />
            <TextField
                fullWidth
                label="Content"
                value={item.content || ''}
                onChange={(e) => onChange({ content: e.target.value })}
                margin="normal"
                multiline
                rows={4}
                disabled={!isEditMode}
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={item.is_templated || false}
                        onChange={(e) => onChange({ is_templated: e.target.checked })}
                        disabled={!isEditMode}
                    />
                }
                label="Is Templated"
            />
            {item.is_templated && (
                <Box>
                    <Typography gutterBottom>Parameters</Typography>
                    <FunctionDefinitionBuilder
                        initialParameters={item.parameters}
                        onChange={(functionDefinition) => onChange({ ...item, parameters: functionDefinition })}
                        isViewOnly={!isEditMode}
                    />
                </Box>
            )}
        </GenericFlexibleView>
    );
};

export default PromptFlexibleView;