import React from 'react';
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
import { ModelComponentProps, ModelType } from '../../../../types/ModelTypes';
import { ApiName } from '../../../../types/ApiTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';

const ModelFlexibleView: React.FC<ModelComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    if (!item) {
        return <Typography>No Model data available.</Typography>;
    }
    const isEditMode = mode === 'edit' || mode === 'create';

    const title = mode === 'create' ? 'Create New Model' : mode === 'edit' ? 'Edit Model' : 'Model Details';
    const saveButtonText = item._id ? 'Update Model' : 'Create Model';

    return (
        <GenericFlexibleView
            elementType='Model'
            title={title}
            onSave={handleSave}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
        >
            <TextField
                fullWidth
                label="Short Name"
                value={item.short_name || ''}
                onChange={(e) => onChange({ short_name: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />
            <TextField
                fullWidth
                label="Model Name"
                value={item.model_name || ''}
                onChange={(e) => onChange({ model_name: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Model Type</InputLabel>
                <Select<ModelType>
                    value={item.model_type || ''}
                    onChange={(e) => onChange({ model_type: e.target.value as ModelType })}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip key={selected} label={selected} />
                        </Box>
                    )}
                    disabled={!isEditMode}
                >
                    {Object.values(ModelType).map((modelType) => (
                        <MenuItem key={modelType} value={modelType}>
                            {modelType}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>API Name</InputLabel>
                <Select
                    value={item.api_name || ''}
                    onChange={(e) => onChange({ api_name: e.target.value as ApiName })}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip key={selected} label={selected} />
                        </Box>
                    )}
                    disabled={!isEditMode}
                >
                    {Object.values(ApiName).map((apiName) => (
                        <MenuItem key={apiName} value={apiName}>
                            {apiName}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                fullWidth
                label="Model Format"
                value={item.model_format || ''}
                onChange={(e) => onChange({ model_format: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />

            <Typography gutterBottom>Temperature</Typography>
            <Slider
                value={item.temperature || 0.7}
                onChange={(_, newValue) => onChange({ temperature: newValue as number })}
                min={0}
                max={1}
                step={0.1}
                valueLabelDisplay="auto"
                disabled={!isEditMode}
            />

            <TextField
                fullWidth
                label="Seed"
                type="number"
                value={item.seed || ''}
                onChange={(e) => onChange({ seed: parseInt(e.target.value) })}
                margin="normal"
                disabled={!isEditMode}
            />

            <TextField
                fullWidth
                label="Context size"
                type="number"
                value={item.ctx_size || ''}
                onChange={(e) => onChange({ ctx_size: parseInt(e.target.value) })}
                margin="normal"
                disabled={!isEditMode}
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={item.use_cache || false}
                        onChange={(e) => onChange({ use_cache: e.target.checked })}
                        disabled={!isEditMode}
                    />
                }
                label="Use Cache"
            />
        </GenericFlexibleView>
    );
};

export default ModelFlexibleView;