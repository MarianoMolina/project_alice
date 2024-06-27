import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { createItem, updateItem, fetchItem } from '../services/api';
import { AliceModel } from '../utils/types';
import useStyles from './ModelStyles';

interface ModelProps {
    modelId?: string;
    onClose: () => void;
}

const Model: React.FC<ModelProps> = ({ modelId, onClose }) => {
    const classes = useStyles();
    const [model, setModel] = useState<Partial<AliceModel>>({
        short_name: '',
        model_name: '',
        model_format: '',
        ctx_size: 0,
        model_type: 'chat',
        deployment: 'local',
        api_key: '',
        api_type: 'openai',
        base_url: '',
    });

    useEffect(() => {
        const fetchModelData = async () => {
            if (modelId) {
                const fetchedModel = await fetchItem('models', modelId);
                setModel(fetchedModel);
            }
        };
        fetchModelData();
    }, [modelId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setModel((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setModel((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            if (modelId) {
                await updateItem('models', modelId, model);
            } else {
                await createItem('models', model);
            }
            onClose();
        } catch (error) {
            console.error('Error saving model:', error);
        }
    };

    return (
        <Box className={classes.container}>
            <Typography variant="h6">{modelId ? 'Edit Model' : 'Create New Model'}</Typography>
            <TextField
                fullWidth
                label="Short Name"
                name="short_name"
                value={model.short_name}
                onChange={handleChange}
                className={classes.formControl}
            />
            <Typography variant="h6">Create New Model</Typography>
            <TextField
                fullWidth
                label="Short Name"
                name="short_name"
                value={model.short_name}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="Model Name"
                name="model_name"
                value={model.model_name}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="Model Format"
                name="model_format"
                value={model.model_format}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                label="Context Size"
                name="ctx_size"
                type="number"
                value={model.ctx_size}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
            <FormControl fullWidth className={classes.formControl}>
                <InputLabel>Model Type</InputLabel>
                <Select
                    name="model_type"
                    value={model.model_type}
                    onChange={handleSelectChange}
                >
                    <MenuItem value="instruct">Instruct</MenuItem>
                    <MenuItem value="chat">Chat</MenuItem>
                    <MenuItem value="vision">Vision</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Deployment</InputLabel>
                <Select
                    name="deployment"
                    value={model.deployment}
                    onChange={handleSelectChange}
                >
                    <MenuItem value="local">Local</MenuItem>
                    <MenuItem value="remote">Remote</MenuItem>
                </Select>
            </FormControl>
            <TextField
                fullWidth
                label="API Key"
                name="api_key"
                value={model.api_key}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>API Type</InputLabel>
                <Select
                    name="api_type"
                    value={model.api_type}
                    onChange={handleSelectChange}
                >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="azure">Azure</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                </Select>
            </FormControl>
            <TextField
                fullWidth
                label="Base URL"
                name="base_url"
                value={model.base_url}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
      <Button variant="contained" onClick={handleSave} className={classes.button}>
        {modelId ? 'Update Model' : 'Create Model'}
      </Button>
    </Box>
  );
};

export default Model;