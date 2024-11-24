import React, { useState, useCallback, useEffect } from 'react';
import {
    Typography,
    Box
} from '@mui/material';
import FunctionDefinitionBuilder from '../../common/function_select/FunctionDefinitionBuilder';
import { PromptComponentProps, Prompt, getDefaultPromptForm } from '../../../../types/PromptTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import { FunctionParameters } from '../../../../types/ParameterTypes';
import Logger from '../../../../utils/Logger';
import { TextInput } from '../../common/inputs/TextInput';
import { BooleanInput } from '../../common/inputs/BooleanInput';
import { NumericInput } from '../../common/inputs/NumericInput';

const PromptFlexibleView: React.FC<PromptComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const [form, setForm] = useState<Partial<Prompt>>(item || getDefaultPromptForm());
    const [isSaving, setIsSaving] = useState(false);
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
            <TextInput
                name="name"
                label="Name"
                value={form.name || ''}
                onChange={(value) => onChange({ name: value })}
                disabled={!isEditMode}
                description='Enter the name of the prompt'
            />
            <TextInput
                name="content"
                label="Content"
                value={form.content || ''}
                onChange={(value) => onChange({ content: value })}
                disabled={!isEditMode}
                multiline
                rows={4}
                description='Enter the content of the prompt. You can use input variables if the prompt is templated, using Jinja2 syntax'
            />
            <BooleanInput
                name="is_templated"
                label="Is Templated"
                value={form.is_templated || false}
                onChange={(value) => onChange({ is_templated: value })}
                disabled={!isEditMode}
                description='Check if the prompt is templated. If templated, it can use input variables'
                
            />
            {form.is_templated && (
                <Box>
                    <FunctionDefinitionBuilder
                        title='Template Parameters'
                        initialParameters={form.parameters}
                        onChange={handleFunctionDefinitionChange}
                        isViewOnly={!isEditMode}
                    />
                </Box>
            )}
            <NumericInput
                name="version"
                label="Version"
                value={form.version || 0}
                onChange={(value) => onChange({ version: value })}
                disabled={!isEditMode}
                description='Prompt version number'
            />
        </GenericFlexibleView>
    );
};

export default PromptFlexibleView;