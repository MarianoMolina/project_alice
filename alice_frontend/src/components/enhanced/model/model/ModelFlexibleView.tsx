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
    Typography
} from '@mui/material';
import { ModelComponentProps } from '../../../../utils/ModelTypes';
import { LlmProvider } from '../../../../utils/ApiTypes';
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
                <Select
                    value={item.model_type || 'chat'}
                    onChange={(e) => onChange({ model_type: e.target.value as 'instruct' | 'chat' | 'vision' })}
                    disabled={!isEditMode}
                >
                    <MenuItem value="chat">Chat</MenuItem>
                    <MenuItem value="instruct">Instruct</MenuItem>
                    <MenuItem value="vision">Vision</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>Deployment</InputLabel>
                <Select
                    value={item.deployment || 'local'}
                    onChange={(e) => onChange({ deployment: e.target.value as 'local' | 'remote' })}
                    disabled={!isEditMode}
                >
                    <MenuItem value="local">Local</MenuItem>
                    <MenuItem value="remote">Remote</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>API Type</InputLabel>
                <Select
                    value={item.api_name || 'openai'}
                    onChange={(e) => onChange({ api_name: e.target.value as LlmProvider })}
                    disabled={!isEditMode}
                >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="azure">Azure</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                    <MenuItem value="lm-studio">LM Studio</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                </Select>
            </FormControl>
            
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