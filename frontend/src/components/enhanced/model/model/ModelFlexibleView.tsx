import React, { useCallback, useEffect, useState } from 'react';
import {
    Slider,
    Typography,
} from '@mui/material';
import { AliceModel, getDefaultModelForm, ModelComponentProps, ModelType } from '../../../../types/ModelTypes';
import { ApiName } from '../../../../types/ApiTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import useStyles from '../ModelStyles';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { TextInput } from '../../common/inputs/TextInput';
import { NumericInput } from '../../common/inputs/NumericInput';
import { BooleanInput } from '../../common/inputs/BooleanInput';
import { IconSelectInput } from '../../common/inputs/IconSelectInput';
import { apiNameIcons, modelTypeIcons } from '../../../../utils/ApiUtils';

const ModelFlexibleView: React.FC<ModelComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const [form, setForm] = useState<Partial<AliceModel>>(() => item || getDefaultModelForm());
    const [isSaving, setIsSaving] = useState(false);
    const classes = useStyles();

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Model' : mode === 'edit' ? 'Edit Model' : 'Model Details';
    const saveButtonText = form?._id ? 'Update Model' : 'Create Model';

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultModelForm());
        } else {
            setForm(item);
        }
    }, [item, onChange]);

    const handleFieldChange = useCallback((field: keyof AliceModel, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
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

    return (
        <GenericFlexibleView
            elementType='Model'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            mode={mode}
            item={form as AliceModel}
            itemType='models'
        >
            <TextInput
                name='short_name'
                label="Short Name"
                value={form?.short_name || ''}
                onChange={(value) => handleFieldChange('short_name', value)}
                description='The short name of the model. A unique identifier for this model.'
                disabled={!isEditMode}
            />
            <TextInput
                name='model_name'
                label="Model Name"
                value={form?.model_name || ''}
                onChange={(value) => handleFieldChange('model_name', value)}
                description='The name of the model. This should be the name the API uses to reference the model.'
                disabled={!isEditMode}
            />
            <IconSelectInput
                name='model_type'
                label="Model Type"
                value={form?.model_type || ''}
                description='The type of model to create. Use Chat for LLM models.'
                onChange={(value) => handleFieldChange('model_type', value as ModelType)}
                options={Object.values(ModelType).map((type) => ({ value: type, label: formatCamelCaseString(type), icon: modelTypeIcons[type] }))}
                disabled={!isEditMode}
            />
            <IconSelectInput
                name='api_name'
                label="API Name"
                value={form?.api_name || ''}
                onChange={(value) => handleFieldChange('api_name', value as ApiName)}
                options={Object.values(ApiName).map((name) => ({ value: name, label: formatCamelCaseString(name), icon: apiNameIcons[name] }))}
                disabled={!isEditMode}
            />
            <TextInput
                name='model_format'
                label="Model Format"
                description='The format of the model. Only relevant in the context of models that use LM Studio.'
                value={form?.model_format || ''}
                onChange={(value) => handleFieldChange('model_format', value)}
                disabled={!isEditMode}
            />
            <NumericInput
                name='seed'
                label="Seed"
                value={form?.seed || undefined}
                onChange={(value) => handleFieldChange('seed', value)}
                disabled={!isEditMode}
            />
            <NumericInput
                name='ctx_size'
                label="Context Size"
                value={form?.ctx_size || undefined}
                description='The context size of the model. Really important to avoid errors, or loss of context that might be handled quietly by the API.'
                onChange={(value) => handleFieldChange('ctx_size', value)}
                disabled={!isEditMode}
            />
            <BooleanInput
                name='use_cache'
                label="Use Cache"
                value={form?.use_cache || false}
                onChange={(value) => handleFieldChange('use_cache', value)}
                disabled={!isEditMode}
            />

            <Typography variant="h6" className={classes.titleText}>Temperature</Typography>
            <Slider
                value={form?.temperature || 0.7}
                onChange={(_, newValue) => onChange({ temperature: newValue as number })}
                min={0}
                max={1}
                step={0.1}
                valueLabelDisplay="auto"
                disabled={!isEditMode}
                sx={{ margin:1}}
            />
        </GenericFlexibleView>
    );
};

export default ModelFlexibleView;