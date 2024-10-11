import React, { useState, useCallback, useEffect } from 'react';
import {
    Typography,
    TextField,
    Switch,
    FormControlLabel,
    Box
} from '@mui/material';
import FunctionDefinitionBuilder from '../../common/function_select/FunctionDefinitionBuilder';
import { PromptComponentProps, Prompt, getDefaultPromptForm } from '../../../../types/PromptTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import { FunctionParameters } from '../../../../types/ParameterTypes';
import Logger from '../../../../utils/Logger';
import useStyles from '../PromptStyles';

const PromptFlexibleView: React.FC<PromptComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const [form, setForm] = useState<Partial<Prompt>>(item || getDefaultPromptForm());
    const [isSaving, setIsSaving] = useState(false);
    const classes = useStyles();
    
    Logger.debug('PromptFlexibleView', 'form', form);

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);
    
    useEffect(() => {
        if (item) {
            setForm(item);
        } else {
            onChange(getDefaultPromptForm());
        }
    }, [item, onChange]);

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
        setIsSaving(true);
    }, [form, onChange]);
    
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

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
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as Prompt}
            itemType="prompts"
        >
            <Typography variant="h6" className={classes.titleText}>Name</Typography>
            <TextField
                fullWidth
                name="name"
                label="Name"
                value={form.name || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode}
            />
            <Typography variant="h6" className={classes.titleText}>Content</Typography>
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
            <Typography variant="h6" className={classes.titleText}>Is templated?</Typography>
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
                    <Typography variant="h6" className={classes.titleText}>Parameters</Typography>
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