import React, { useCallback, useEffect } from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Switch,
    FormControlLabel,
    Typography,
    Box,
    Chip
} from '@mui/material';
import { AliceModel, getDefaultModelForm, ModelComponentProps, ModelType } from '../../../../types/ModelTypes';
import { ApiName } from '../../../../types/ApiTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import useStyles from '../ModelStyles';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { TextInput } from '../../common/inputs/TextInput';
import { SelectInput } from '../../common/inputs/SelectInput';
import { NumericInput } from '../../common/inputs/NumericInput';
import { BooleanInput } from '../../common/inputs/BooleanInput';

const ModelFlexibleView: React.FC<ModelComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultModelForm());
        }
    }, [item, onChange]);
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const title = mode === 'create' ? 'Create New Model' : mode === 'edit' ? 'Edit Model' : 'Model Details';
    const saveButtonText = item?._id ? 'Update Model' : 'Create Model';

    return (
        <GenericFlexibleView
            elementType='Model'
            title={title}
            onSave={handleSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as AliceModel}
            itemType='models'
        >
            <TextInput
                name='short_name'
                label="Short Name"
                value={item?.short_name || ''}
                onChange={(value) => onChange({ short_name: value })}
                description='The short name of the model. A unique identifier for this model.'
                disabled={!isEditMode}
            />
            <TextInput
                name='model_name'
                label="Model Name"
                value={item?.model_name || ''}
                onChange={(value) => onChange({ model_name: value })}
                description='The name of the model. This should be the name the API uses to reference the model.'
                disabled={!isEditMode}
            />
            <SelectInput
                name='model_type'
                label="Model Type"
                value={item?.model_type || ''}
                description='The type of model to create. Use Chat for LLM models.'
                onChange={(value) => onChange({ model_type: value as ModelType })}
                options={Object.values(ModelType).map((type) => ({ value: type, label: formatCamelCaseString(type) }))}
                disabled={!isEditMode}
            />
            <SelectInput
                name='api_name'
                label="API Name"
                value={item?.api_name || ''}
                onChange={(value) => onChange({ api_name: value as ApiName })}
                options={Object.values(ApiName).map((name) => ({ value: name, label: formatCamelCaseString(name) }))}
                disabled={!isEditMode}
            />
            <TextInput
                name='model_format'
                label="Model Format"
                description='The format of the model. Only relevant in the context of models that use LM Studio.'
                value={item?.model_format || ''}
                onChange={(value) => onChange({ model_format: value })}
                disabled={!isEditMode}
            />
            <NumericInput
                name='seed'
                label="Seed"
                value={item?.seed || undefined}
                onChange={(value) => onChange({ seed: value })}
                disabled={!isEditMode}
            />
            <NumericInput
                name='ctx_size'
                label="Context Size"
                value={item?.ctx_size || undefined}
                description='The context size of the model. Really important to avoid errors, or loss of context that might be handled quietly by the API.'
                onChange={(value) => onChange({ ctx_size: value })}
                disabled={!isEditMode}
            />
            <BooleanInput
                name='use_cache'
                label="Use Cache"
                value={item?.use_cache || false}
                onChange={(value) => onChange({ use_cache: value })}
                disabled={!isEditMode}
            />

            <Typography variant="h6" className={classes.titleText}>Temperature</Typography>
            <Slider
                value={item?.temperature || 0.7}
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