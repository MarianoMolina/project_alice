import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
} from '@mui/material';
import { ToolCallComponentProps, ToolCall, getDefaultToolCallForm, ToolCallConfig } from '../../../../types/ToolCallTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import useStyles from '../ToolCallStyles';
import { TextInput } from '../../common/inputs/TextInput';
import { useNotification } from '../../../../contexts/NotificationContext';

const ToolCallFlexibleView: React.FC<ToolCallComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const { addNotification } = useNotification();
    const classes = useStyles();
    const [form, setForm] = useState<Partial<ToolCall>>(item || getDefaultToolCallForm());
    const [isSaving, setIsSaving] = useState(false);

    const [localArguments, setLocalArguments] = useState<string>('');
    const [argumentsError, setArgumentsError] = useState<string>('');

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Tool Call' : mode === 'edit' ? 'Edit Tool Call' : 'Tool Call Details';
    const saveButtonText = item?._id ? 'Update Tool Call' : 'Create Tool Call';

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (item && Object.keys(item).length > 0) {
            setForm(item);
            if (item?.function?.arguments) {
                const argsString = typeof item.function.arguments === 'string'
                    ? item.function.arguments
                    : JSON.stringify(item.function.arguments, null, 2);
                setLocalArguments(argsString);
            }
        } else {
            onChange(getDefaultToolCallForm());
        }
    }, [item, onChange]);

    const handleFieldChange = useCallback((field: keyof ToolCall, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
    }, []);

    const handleLocalSave = useCallback(() => {
        try {
            // If it looks like JSON, verify it's valid
            if (localArguments.trim().startsWith('{') || localArguments.trim().startsWith('[')) {
                JSON.parse(localArguments);
            }
            onChange(form);
            setIsSaving(true);
        } catch (error) {
            addNotification('Invalid JSON format', 'error');
            setArgumentsError('Invalid JSON format');
        }
    }, [form, onChange]);

    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const handleArgumentsChange = useCallback((value: string | undefined) => {
        const newValue = value || '';
        setLocalArguments(newValue);

        try {
            // Handle both string and object arguments
            let parsedValue: Record<string, any> | string = newValue;

            // If it looks like JSON, try to parse it
            if (newValue.trim().startsWith('{') || newValue.trim().startsWith('[')) {
                parsedValue = JSON.parse(newValue);
            }

            // Create a complete function config to ensure type safety
            const functionConfig: ToolCallConfig = {
                name: item?.function?.name || '',
                arguments: parsedValue
            };

            handleFieldChange('function', functionConfig);
            setArgumentsError('');
        } catch (error) {
            setArgumentsError('Invalid JSON format');
        }
    }, [item, handleFieldChange]);

    const handleNameChange = useCallback((newName: string | undefined) => {
        if (!newName) return;

        const functionConfig: ToolCallConfig = {
            name: newName,
            arguments: item?.function?.arguments || {}
        };

        handleFieldChange('function', functionConfig);
    }, [item, handleFieldChange]);

    return (
        <GenericFlexibleView
            elementType='Tool Call'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={form as ToolCall}
            itemType='toolcalls'
        >
            <TextInput
                name='type'
                label='Type'
                value={form?.type || 'function'}
                onChange={() => { }}
                description='Type is always function.'
                disabled={true}
            />
            <TextInput
                name='function.name'
                label='Function Name'
                value={form?.function?.name || ''}
                onChange={handleNameChange}
                disabled={!isEditMode}
                required
                description='Enter the name of the function to call.'
            />
            <TextInput
                name='function.arguments'
                label='Arguments'
                value={localArguments}
                onChange={handleArgumentsChange}
                disabled={!isEditMode}
                error={argumentsError}
                required
                multiline
                rows={8}
                description='Enter the arguments for the function as JSON or plain text.'
            />
            {isEditMode && (
                <Alert severity="info" className={classes.alert}>
                    Arguments can be either a JSON object or a simple string.
                    If entering a JSON object, ensure it's properly formatted.
                </Alert>
            )}
        </GenericFlexibleView>
    );
};

export default ToolCallFlexibleView;