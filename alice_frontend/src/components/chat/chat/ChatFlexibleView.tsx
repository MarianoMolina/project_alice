import React from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Button
} from '@mui/material';
import useStyles from '../ChatStyles';
import { ChatComponentProps } from '../../../utils/ChatTypes';
import EnhancedModel from '../../model/model/EnhancedModel';
import EnhancedAgent from '../../agent/agent/EnhancedAgent';
import EnhancedTask from '../../task/task/EnhancedTask';
import { AliceAgent } from '../../../utils/AgentTypes';
import { AliceModel } from '../../../utils/ModelTypes';
import { AliceTask } from '../../../utils/TaskTypes';

const ChatFlexibleView: React.FC<ChatComponentProps> = ({ 
    item,
    onChange,
    mode,
    handleSave
}) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    const updateChatField = (field: keyof typeof item, value: any) => {
        onChange({ ...item, [field]: value });
    };

    const handleModelChange = (selectedModel: Partial<AliceModel>) => {
        updateChatField('model_id', selectedModel);
    };

    const handleAgentChange = (selectedAgent: Partial<AliceAgent>) => {
        updateChatField('alice_agent', selectedAgent);
    };

    const handleExecutorChange = (selectedAgent: Partial<AliceAgent>) => {
        updateChatField('executor', selectedAgent);
    };

    const handleTaskChange = (selectedTask: Partial<AliceTask>) => {
        const updatedFunctions = item.functions 
            ? item.functions.some(f => f._id === selectedTask._id)
                ? item.functions.filter(f => f._id !== selectedTask._id)
                : [...item.functions, selectedTask as AliceTask]
            : [selectedTask as AliceTask];
        updateChatField('functions', updatedFunctions);
    };

    return (
        <Box className={classes.createEditForm}>
            <Typography variant="h6">
                {mode === 'create' ? 'Create New Chat' : mode === 'edit' ? 'Edit Chat' : 'Chat Details'}
            </Typography>
            <TextField
                fullWidth
                label="Chat Name"
                value={item.name || ''}
                onChange={(e) => updateChatField('name', e.target.value)}
                className={classes.formControl}
                disabled={mode === 'view'}
            />
            <FormControl fullWidth className={classes.formControl}>
                <InputLabel>Agent</InputLabel>
                <EnhancedAgent
                    mode="list"
                    fetchAll={true}
                    onInteraction={handleAgentChange}
                    isInteractable={mode !== 'view'}
                />
            </FormControl>
            <FormControl fullWidth className={classes.formControl}>
                <InputLabel>Executor agent</InputLabel>
                <EnhancedAgent
                    mode="list"
                    fetchAll={true}
                    onInteraction={handleExecutorChange}
                    isInteractable={mode !== 'view'}
                />
            </FormControl>
            <FormControl fullWidth className={classes.formControl}>
                <InputLabel>Model</InputLabel>
                <EnhancedModel
                    mode="list"
                    fetchAll={true}
                    onInteraction={handleModelChange}
                    isInteractable={mode !== 'view'}
                />
            </FormControl>
            <Typography variant="subtitle1">Functions</Typography>
            <Box className={classes.chipContainer}>
                <EnhancedTask
                    mode="list"
                    fetchAll={true}
                    onInteraction={handleTaskChange}
                    isInteractable={mode !== 'view'}
                />
            </Box>
            {mode !== 'view' && (
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    fullWidth
                    className={classes.createButton}
                >
                    {mode === 'create' ? 'Create Chat' : 'Update Chat'}
                </Button>
            )}
        </Box>
    );
};

export default ChatFlexibleView;