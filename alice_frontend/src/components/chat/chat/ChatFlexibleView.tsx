import React from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Button
} from '@mui/material';
import useStyles from '../ChatStyles';
import { ChatComponentProps } from '../../../utils/ChatTypes';
import { useConfig } from '../../../context/ConfigContext';

const ChatFlexibleView: React.FC<ChatComponentProps> = ({ 
    item,
    onChange,
    mode,
    handleSave
}) => {
    const classes = useStyles();
    const {
        agents,
        models,
        tasks,
    } = useConfig();

    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    const updateChatField = (field: keyof typeof item, value: any) => {
        onChange({ ...item, [field]: value });
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
                <Select
                    value={item.alice_agent?._id || ''}
                    onChange={(e) => {
                        const selectedAgent = agents.find(agent => agent._id === e.target.value);
                        updateChatField('alice_agent', selectedAgent || item.alice_agent);
                    }}
                    disabled={mode === 'view'}
                >
                    {agents.map((agent) => (
                        <MenuItem key={agent._id} value={agent._id}>{agent.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl fullWidth className={classes.formControl}>
                <InputLabel>Executor agent</InputLabel>
                <Select
                    value={item.executor?._id || ''}
                    onChange={(e) => {
                        const selectedAgent = agents.find(executor => executor._id === e.target.value);
                        updateChatField('executor', selectedAgent || item.executor);
                    }}
                    disabled={mode === 'view'}
                >
                    {agents.map((agent) => (
                        <MenuItem key={agent._id} value={agent._id}>{agent.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Typography variant="subtitle1">Functions</Typography>
            <Box className={classes.chipContainer}>
                {tasks.map((task) => (
                    <Chip
                        key={task._id}
                        label={task.task_name}
                        onClick={() => {
                            if (mode !== 'view') {
                                const updatedFunctions = item.functions?.includes(task)
                                    ? item.functions.filter(f => f._id !== task._id)
                                    : [...(item.functions || []), task];
                                updateChatField('functions', updatedFunctions);
                            }
                        }}
                        color={item.functions?.some(f => f._id === task._id) ? "primary" : "default"}
                        disabled={mode === 'view'}
                    />
                ))}
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