import React from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    FormControlLabel,
    Button,
    Switch
} from '@mui/material';
import { AgentComponentProps } from '../../../utils/AgentTypes';
import { Prompt } from '../../../utils/PromptTypes';
import { AliceModel } from '../../../utils/ModelTypes';
import EnhancedModel from '../../model/model/EnhancedModel';
import EnhancedPrompt from '../../prompt/prompt/EnhancedPrompt';

const AgentFlexibleView: React.FC<AgentComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    if (!item) {
        return <Typography>No agent data available.</Typography>;
    }
    const isEditMode = mode === 'edit' || mode === 'create';

    const handleModelChange = (selectedModel: AliceModel) => {
        onChange({ model_id: selectedModel || null });
    };

    const handlePromptChange = (selectedPrompt: Prompt) => {
        onChange({ system_message: selectedPrompt });
    };

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
                <EnhancedPrompt
                    mode="list"
                    fetchAll={true}
                    onInteraction={handlePromptChange}
                    isInteractable={isEditMode}
                />
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>Model</InputLabel>
                <EnhancedModel
                    mode="list"
                    fetchAll={true}
                    onInteraction={handleModelChange}
                    isInteractable={isEditMode}
                />
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
            {isEditMode && (
                <Button variant="contained" color="primary" onClick={handleSave} sx={{ mt: 2 }}>
                    {item?._id ? 'Update Agent' : 'Create Agent'}
                </Button>
            )}
        </Box>
    );
};

export default AgentFlexibleView;