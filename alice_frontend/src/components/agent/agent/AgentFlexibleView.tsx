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
            <Typography gutterBottom>Temperature</Typography>

            {isEditMode && (
                <Button variant="contained" color="primary" onClick={handleSave}>
                    {item?._id ? 'Update Agent' : 'Create Agent'}
                </Button>
            )}
        </Box>
    );
};

export default AgentFlexibleView;