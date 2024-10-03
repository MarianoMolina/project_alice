import React, { useState, useCallback } from 'react';
import {
    Typography,
    TextField,
    Switch,
    FormControlLabel,
    Box
} from '@mui/material';
import FunctionDefinitionBuilder from '../../common/function_select/FunctionDefinitionBuilder';
import { PromptComponentProps, Prompt } from '../../../../types/PromptTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import { FunctionParameters } from '../../../../types/ParameterTypes';

const PromptFlexibleView: React.FC<PromptComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    const [form, setForm] = useState<Partial<Prompt>>(item || {});

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    }, []);

    const handleSwitchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: checked }));
    }, []);

    const handleFunctionDefinitionChange = useCallback((newDefinition: FunctionParameters) => {
        setForm(prevForm => ({ ...prevForm, parameters: newDefinition }));
    }, []);

    const handleLocalSave = useCallback(() => {
        onChange(form);
        handleSave();
    }, [form, onChange, handleSave]);

    if (!form) {
        return <Typography>No Prompt data available.</Typography>;
    }

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Prompt' : mode === 'edit' ? 'Edit Prompt' : 'Prompt Details';
    const saveButtonText = form._id ? 'Update Prompt' : 'Create Prompt';

    return (
        <GenericFlexibleView
            elementType="Prompt"
            title={title}
            onSave={handleLocalSave}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
        >
            <TextField
                fullWidth
                name="name"
                label="Name"
                value={form.name || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode}
            />
            <TextField
                fullWidth
                name="content"
                label="Content"
                value={form.content || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={4}
                disabled={!isEditMode}
            />
            <FormControlLabel
                control={
                    <Switch
                        name="is_templated"
                        checked={form.is_templated || false}
                        onChange={handleSwitchChange}
                        disabled={!isEditMode}
                    />
                }
                label="Is Templated"
            />
            {form.is_templated && (
                <Box>
                    <Typography gutterBottom>Parameters</Typography>
                    <FunctionDefinitionBuilder
                        initialParameters={form.parameters}
                        onChange={handleFunctionDefinitionChange}
                        isViewOnly={!isEditMode}
                    />
                </Box>
            )}
        </GenericFlexibleView>
    );
};

export default PromptFlexibleView;