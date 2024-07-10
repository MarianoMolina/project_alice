import React from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    FormControlLabel,
    Button,
    Switch
} from '@mui/material';
import { AgentComponentProps } from '../../../utils/AgentTypes';
import { useConfig } from '../../../context/ConfigContext';
import { Prompt } from '../../../utils/PromptTypes';
import { AliceModel } from '../../../utils/ModelTypes';

const AgentFlexibleView: React.FC<AgentComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    const {
        models,
        prompts,
    } = useConfig();

    if (!item) {
        return <Typography>No agent data available.</Typography>;
    }
    const isEditMode = mode === 'edit' || mode === 'create';
    console.log('item', item);
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
            <FormControl fullWidth margin="normal">
                <InputLabel>System Message</InputLabel>
                <Select
                    value={item?.system_message._id}
                    onChange={(e) => onChange({ system_message: prompts.find(prompt => prompt._id === e.target.value)})}
                    disabled={!isEditMode}
                >
                    {prompts.map((prompt: Prompt) => (
                        <MenuItem key={prompt._id} value={prompt._id}>{prompt.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControlLabel
                control={
                    <Switch
                        checked={item?.code_execution_config || false}
                        onChange={(e) => onChange({ code_execution_config: e.target.checked })}
                        disabled={!isEditMode}
                    />
                }
                label="Execute Code"
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Model</InputLabel>
                <Select
                    value={item?.model_id?._id || ''}
                    onChange={(e) => onChange({ model_id: models.find(model => model._id === e.target.value)})}
                    disabled={!isEditMode}
                >
                    {models.map((model: AliceModel) => (
                        <MenuItem key={model._id} value={model._id}>{model.short_name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Typography gutterBottom>Temperature</Typography>
            <Slider
                value={parseFloat(item?.llm_config?.temperature as string) || 0.7}
                onChange={(_, newValue) => onChange({ llm_config: { ...item?.llm_config, temperature: newValue.toString() } })}
                min={0}
                max={1}
                step={0.1}
                disabled={!isEditMode}
            />
            <Typography gutterBottom>Timeout (seconds)</Typography>
            <Slider
                value={parseInt(item?.llm_config?.timeout as string) || 300}
                onChange={(_, newValue) => onChange({ llm_config: { ...item?.llm_config, timeout: newValue.toString() } })}
                min={30}
                max={600}
                step={30}
                disabled={!isEditMode}
            />
            {isEditMode && (
                <Button variant="contained" color="primary" onClick={handleSave}>
                    {item?._id ? 'Update Agent' : 'Create Agent'}
                </Button>
            )}
        </Box>
    );
};

export default AgentFlexibleView;