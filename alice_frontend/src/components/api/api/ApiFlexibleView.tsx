import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    Button,
} from '@mui/material';
import { ApiComponentProps, API } from '../../../utils/ApiTypes';
import { ApiType } from '../../../utils/ApiTypes';
import { API_TYPE_CONFIGS, LLM_PROVIDERS, isLlmApi, getAvailableApiTypes } from '../../../utils/ApiUtils';
import { useAuth } from '../../../context/AuthContext';

interface LlmProviders {
    [key: string]: {
        name: string;
        baseUrl: string;
    };
}

const ApiFlexibleView: React.FC<ApiComponentProps> = ({
    items,
    item,
    onChange,
    mode,
    handleSave,
}) => {
    const [availableApiTypes, setAvailableApiTypes] = useState<ApiType[]>([]);
    const [llmProvider, setLlmProvider] = useState<string>('');
    const { user } = useAuth();
    if (!user) return null;

    const defaultItem: API = {
        name: '',
        api_type: ApiType.LLM_API,
        is_active: false,
        health_status: 'unknown',
        api_config: {},
        user: user, 
    };

    const currentItem = mode === "create" ? defaultItem : item ?? defaultItem;

    useEffect(() => {
        if (items) {
            setAvailableApiTypes(getAvailableApiTypes(items));
        }
    }, [items]);

    useEffect(() => {
        if (currentItem && isLlmApi(currentItem.api_type)) {
            const provider = Object.entries(LLM_PROVIDERS).find(([_, config]) => config.baseUrl === currentItem.api_config.base_url);
            setLlmProvider(provider ? provider[0] : 'Custom');
        }
    }, [currentItem]);

    const isEditMode = mode === 'edit' || mode === 'create';
    const isCreateMode = mode === 'create';

    const handleApiTypeChange = (newApiType: ApiType) => {
        onChange({
            api_type: newApiType,
            api_config: API_TYPE_CONFIGS[newApiType].apiConfig,
            name: API_TYPE_CONFIGS[newApiType].name,
        });
        setLlmProvider('');
    };

    const handleLlmProviderChange = (provider: string) => {
        setLlmProvider(provider);
        if (provider !== 'Custom') {
            onChange({
                api_config: {
                    ...currentItem.api_config,
                    base_url: (LLM_PROVIDERS as LlmProviders)[provider].baseUrl,
                },
                name: (LLM_PROVIDERS as LlmProviders)[provider].name,
            });
        }
    };

    const handleApiConfigChange = (key: string, value: string) => {
        onChange({
            api_config: {
                ...currentItem.api_config,
                [key]: value
            }
        });
    };

    return (
        <Box>
            {isCreateMode && (
                <FormControl fullWidth margin="normal">
                    <InputLabel>API Type</InputLabel>
                    <Select
                        value={currentItem.api_type || ''}
                        onChange={(e) => handleApiTypeChange(e.target.value as ApiType)}
                    >
                        {availableApiTypes.map((type) => (
                            <MenuItem key={type} value={type}>{API_TYPE_CONFIGS[type].name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {isLlmApi(currentItem.api_type) && isCreateMode && (
                <FormControl fullWidth margin="normal">
                    <InputLabel>LLM Provider</InputLabel>
                    <Select
                        value={llmProvider}
                        onChange={(e) => handleLlmProviderChange(e.target.value)}
                    >
                        {Object.entries(LLM_PROVIDERS).map(([key, config]) => (
                            <MenuItem key={key} value={key}>{config.name}</MenuItem>
                        ))}
                        <MenuItem value="Custom">Custom</MenuItem>
                    </Select>
                </FormControl>
            )}

            <TextField
                fullWidth
                label="API Name"
                value={currentItem.name || ''}
                onChange={(e) => onChange({ name: e.target.value })}
                margin="normal"
                disabled={!isEditMode || (isLlmApi(currentItem.api_type) && llmProvider !== 'Custom')}
            />

            {Object.entries(currentItem.api_config).map(([key, value]) => (
                <TextField
                    key={key}
                    fullWidth
                    label={key}
                    type={key.includes('key') || key.includes('secret') ? "password" : "text"}
                    value={value}
                    onChange={(e) => handleApiConfigChange(key, e.target.value)}
                    margin="normal"
                    disabled={!isEditMode || (key === 'base_url' && isLlmApi(currentItem.api_type) && llmProvider !== 'Custom')}
                />
            ))}

            <FormControl fullWidth margin="normal">
                <InputLabel>Is Active</InputLabel>
                <Switch
                    checked={currentItem.is_active || false}
                    onChange={(e) => onChange({ is_active: e.target.checked })}
                    disabled={!isEditMode}
                />
            </FormControl>

            <Typography>Health Status: {currentItem.health_status}</Typography>

            {isEditMode && (
                <Button variant="contained" color="primary" onClick={handleSave}>
                    {isCreateMode ? 'Create API' : 'Update API'}
                </Button>
            )}
        </Box>
    );
};

export default ApiFlexibleView;