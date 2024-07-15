import React, { useEffect, useState, useMemo } from 'react';
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
    CircularProgress,
} from '@mui/material';
import { ApiComponentProps, API } from '../../../utils/ApiTypes';
import { ApiType } from '../../../utils/ApiTypes';
import { API_TYPE_CONFIGS, LLM_PROVIDERS, isLlmApi, getAvailableApiTypes } from '../../../utils/ApiUtils';
import { useAuth } from '../../../context/AuthContext';
import useStyles from '../ApiStyles';

const ApiFlexibleView: React.FC<ApiComponentProps> = ({
    items,
    item,
    onChange,
    mode,
    handleSave,
}) => {
    console.log('ApiFlexibleView render start', { items, item, mode });

    const classes = useStyles();
    const { user } = useAuth();
    const [availableApiTypes, setAvailableApiTypes] = useState<ApiType[]>([]);
    const [llmProvider, setLlmProvider] = useState<string>('');
    const [localItem, setLocalItem] = useState<API | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const defaultItem: API = useMemo(() => {
        console.log('Creating default item');
        return {
            name: '',
            api_type: ApiType.LLM_API,
            is_active: false,
            health_status: 'unknown',
            api_config: {
                api_key: '',
                base_url: '',
            },
        };
    }, []);

    useEffect(() => {
        console.log('useEffect [items]', { items });
        if (items) {
            const types = getAvailableApiTypes(items);
            setAvailableApiTypes(types);
        }
    }, [items]);

    useEffect(() => {
        console.log('useEffect [item, mode, onChange, defaultItem]', { item, mode });
        if (item && Object.keys(item).length > 0) {
            console.log('Setting localItem from item', item);
            setLocalItem(item);
            if (isLlmApi(item.api_type) && item.api_config && item.api_config.base_url) {
                const provider = Object.entries(LLM_PROVIDERS).find(([_, config]) => config.baseUrl === item.api_config.base_url);
                setLlmProvider(provider ? provider[0] : 'Custom');
            }
        } else if (mode === 'create') {
            console.log('Setting localItem to defaultItem', defaultItem);
            setLocalItem(defaultItem);
            onChange(defaultItem);
        }
        setIsLoading(false);
    }, [item, mode, onChange, defaultItem]);

    const handleChange = (field: keyof API, value: any) => {
        console.log('handleChange', { field, value });
        if (localItem) {
            const updatedItem = { ...localItem, [field]: value };
            setLocalItem(updatedItem);
            onChange(updatedItem);
        }
    };

    const handleApiConfigChange = (key: string, value: string) => {
        console.log('handleApiConfigChange', { key, value });
        if (localItem) {
            const updatedItem = {
                ...localItem,
                api_config: { ...localItem.api_config, [key]: value }
            };
            setLocalItem(updatedItem);
            onChange(updatedItem);
        }
    };

    const handleApiTypeChange = (newApiType: ApiType) => {
        console.log('handleApiTypeChange', { newApiType });
        if (localItem) {
            const updatedItem = {
                ...localItem,
                api_type: newApiType,
                api_config: API_TYPE_CONFIGS[newApiType].apiConfig,
                name: API_TYPE_CONFIGS[newApiType].name,
            };
            setLocalItem(updatedItem);
            onChange(updatedItem);
            setLlmProvider('');
        }
    };

    const handleLlmProviderChange = (provider: string) => {
        console.log('handleLlmProviderChange', { provider });
        setLlmProvider(provider);
        if (provider !== 'Custom' && provider in LLM_PROVIDERS && localItem) {
            const updatedItem = {
                ...localItem,
                api_config: {
                    ...localItem.api_config,
                    base_url: LLM_PROVIDERS[provider as keyof typeof LLM_PROVIDERS].baseUrl,
                    api_key: '',
                },
                name: LLM_PROVIDERS[provider as keyof typeof LLM_PROVIDERS].name,
            };
            setLocalItem(updatedItem);
            onChange(updatedItem);
        }
    };

    console.log('Before render', { isLoading, localItem, user });

    if (isLoading) {
        return <CircularProgress />;
    }

    if (!localItem || !user) {
        console.log('No localItem or user:', { localItem, user });
        return <Typography>No API data available.</Typography>;
    }

    const isEditMode = mode === 'edit' || mode === 'create';
    const isCreateMode = mode === 'create';

    console.log('Rendering form', { localItem, isEditMode, isCreateMode });

    return (
        <Box className={classes.formContainer}>
            {isCreateMode && (
                <FormControl fullWidth margin="normal">
                    <InputLabel>API Type</InputLabel>
                    <Select
                        value={localItem.api_type || ''}
                        onChange={(e) => handleApiTypeChange(e.target.value as ApiType)}
                    >
                        {availableApiTypes.map((type) => (
                            <MenuItem key={type} value={type}>{API_TYPE_CONFIGS[type].name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {isLlmApi(localItem.api_type) && isCreateMode && (
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
                value={localItem.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                margin="normal"
                disabled={!isEditMode || (isLlmApi(localItem.api_type) && llmProvider !== 'Custom')}
            />

            {localItem.api_config && Object.entries(localItem.api_config).map(([key, value]) => (
                <TextField
                    key={key}
                    fullWidth
                    label={key}
                    type="text"
                    value={value || ''}
                    onChange={(e) => handleApiConfigChange(key, e.target.value)}
                    margin="normal"
                    disabled={!isEditMode || (key === 'base_url' && isLlmApi(localItem.api_type) && llmProvider !== 'Custom')}
                />
            ))}

            <FormControl fullWidth margin="normal">
                <InputLabel>Is Active</InputLabel>
                <Switch
                    checked={localItem.is_active || false}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    disabled={!isEditMode}
                />
            </FormControl>

            {isEditMode && (
                <Button variant="contained" color="primary" onClick={handleSave} className={classes.saveButton}>
                    {isCreateMode ? 'Create API' : 'Update API'}
                </Button>
            )}
        </Box>
    );
};

export default ApiFlexibleView;