import React, { useState, useCallback, useEffect } from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    Alert,
} from '@mui/material';
import { APIConfigComponentProps, APIConfig, getDefaultAPIConfigForm, HealthStatus } from '../../../../types/ApiConfigTypes';
import { ApiName } from '../../../../types/ApiTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import useStyles from '../APIConfigStyles';
import { API_BASE_URLS } from '../../../../utils/ApiUtils';

const APIConfigFlexibleView: React.FC<APIConfigComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const [form, setForm] = useState<Partial<APIConfig>>(() => ({
        ...(item || getDefaultAPIConfigForm()),
    }));
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const classes = useStyles();

    const isEditMode = mode === 'edit' || mode === 'create';
    const isCreateMode = mode === 'create';

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (item) {
            setForm(item);
        } else if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultAPIConfigForm());
        }
    }, [item, onChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    }, []);

    const handleHealthStatusChange = useCallback((status: HealthStatus) => {
        setForm(prevForm => ({ ...prevForm, health_status: status }));
    }, []);

    const handleDataChange = useCallback((field: string, value: string) => {
        setForm(prevForm => ({
            ...prevForm,
            data: {
                ...prevForm.data,
                [field]: value
            }
        }));
    }, []);

    const handleApiNameChange = useCallback((newApiName: ApiName) => {
        // Pre-fill base_url if available
        const baseUrl = API_BASE_URLS[newApiName] || '';
        
        setForm(prevForm => ({
            ...prevForm,
            api_name: newApiName,
            data: {
                base_url: baseUrl,
            }
        }));
    }, []);

    const validateForm = useCallback(() => {
        if (!form.name?.trim()) {
            setValidationError('Name is required');
            return false;
        }
        if (!form.api_name) {
            setValidationError('API Name is required');
            return false;
        }
        if (form.health_status === undefined) {
            setValidationError('Health status is required');
            return false;
        }

        // Validate required fields based on API type
        const data = form.data || {};
        switch (form.api_name) {
            case ApiName.OPENAI:
            case ApiName.ANTHROPIC:
            case ApiName.GEMINI:
            case ApiName.MISTRAL:
            case ApiName.COHERE:
            case ApiName.LLAMA:
            case ApiName.GROQ:
            case ApiName.AZURE:
            case ApiName.CUSTOM:
                if (!data.api_key?.trim()) {
                    setValidationError('API Key is required');
                    return false;
                }
                if (!data.base_url?.trim()) {
                    setValidationError('Base URL is required');
                    return false;
                }
                break;
            case ApiName.GOOGLE_SEARCH:
                if (!data.api_key?.trim() || !data.cse_id?.trim()) {
                    setValidationError('API Key and CSE ID are required for Google Search');
                    return false;
                }
                break;
            case ApiName.REDDIT:
                if (!data.client_id?.trim() || !data.client_secret?.trim()) {
                    setValidationError('Client ID and Client Secret are required for Reddit');
                    return false;
                }
                break;
            case ApiName.WOLFRAM_ALPHA:
                if (!data.app_id?.trim()) {
                    setValidationError('App ID is required for Wolfram Alpha');
                    return false;
                }
                break;
            case ApiName.EXA:
            case ApiName.GOOGLE_KNOWLEDGE_GRAPH:
                if (!data.api_key?.trim()) {
                    setValidationError('API Key is required');
                    return false;
                }
                break;
        }

        setValidationError(null);
        return true;
    }, [form]);

    const handleLocalSave = useCallback(() => {
        if (validateForm()) {
            onChange(form);
            setIsSaving(true);
        }
    }, [form, onChange, validateForm]);

    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const renderConfigFields = () => {
        if (!form.api_name) return null;

        const data = form.data || {};
        
        switch (form.api_name) {
            case ApiName.OPENAI:
            case ApiName.ANTHROPIC:
            case ApiName.GEMINI:
            case ApiName.MISTRAL:
            case ApiName.COHERE:
            case ApiName.LLAMA:
            case ApiName.GROQ:
            case ApiName.AZURE:
            case ApiName.CUSTOM:
                return (
                    <>
                        <TextField
                            fullWidth
                            type="password"
                            label="API Key"
                            value={data.api_key || ''}
                            onChange={(e) => handleDataChange('api_key', e.target.value)}
                            margin="normal"
                            disabled={!isEditMode}
                        />
                        <TextField
                            fullWidth
                            label="Base URL"
                            value={data.base_url || ''}
                            onChange={(e) => handleDataChange('base_url', e.target.value)}
                            margin="normal"
                            disabled={!isEditMode}
                        />
                    </>
                );
            case ApiName.GOOGLE_SEARCH:
                return (
                    <>
                        <TextField
                            fullWidth
                            type="password"
                            label="API Key"
                            value={data.api_key || ''}
                            onChange={(e) => handleDataChange('api_key', e.target.value)}
                            margin="normal"
                            disabled={!isEditMode}
                        />
                        <TextField
                            fullWidth
                            label="CSE ID"
                            value={data.cse_id || ''}
                            onChange={(e) => handleDataChange('cse_id', e.target.value)}
                            margin="normal"
                            disabled={!isEditMode}
                        />
                    </>
                );
            case ApiName.REDDIT:
                return (
                    <>
                        <TextField
                            fullWidth
                            label="Client ID"
                            value={data.client_id || ''}
                            onChange={(e) => handleDataChange('client_id', e.target.value)}
                            margin="normal"
                            disabled={!isEditMode}
                        />
                        <TextField
                            fullWidth
                            type="password"
                            label="Client Secret"
                            value={data.client_secret || ''}
                            onChange={(e) => handleDataChange('client_secret', e.target.value)}
                            margin="normal"
                            disabled={!isEditMode}
                        />
                    </>
                );
            case ApiName.WOLFRAM_ALPHA:
                return (
                    <TextField
                        fullWidth
                        type="password"
                        label="App ID"
                        value={data.app_id || ''}
                        onChange={(e) => handleDataChange('app_id', e.target.value)}
                        margin="normal"
                        disabled={!isEditMode}
                    />
                );
            case ApiName.EXA:
            case ApiName.GOOGLE_KNOWLEDGE_GRAPH:
                return (
                    <TextField
                        fullWidth
                        type="password"
                        label="API Key"
                        value={data.api_key || ''}
                        onChange={(e) => handleDataChange('api_key', e.target.value)}
                        margin="normal"
                        disabled={!isEditMode}
                    />
                );
            default:
                return null;
        }
    };

    const title = mode === 'create' ? 'Create New API Config' : mode === 'edit' ? 'Edit API Config' : 'API Config Details';
    const saveButtonText = form._id ? 'Update API Config' : 'Create API Config';

    return (
        <GenericFlexibleView
            elementType='APIConfig'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as APIConfig}
            itemType='apiconfigs'
        >
            {validationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {validationError}
                </Alert>
            )}
            
            <Typography variant="h6" className={classes.titleText}>Name</Typography>
            <TextField
                fullWidth
                name="name"
                label="Config Name"
                value={form.name || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode}
            />

            <Typography variant="h6" className={classes.titleText}>API Type</Typography>
            <FormControl fullWidth margin="normal">
                <InputLabel>API Name</InputLabel>
                <Select
                    value={form.api_name || ''}
                    onChange={(e) => handleApiNameChange(e.target.value as ApiName)}
                    disabled={!isCreateMode}
                >
                    {Object.values(ApiName).map((name) => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {form.api_name && (
                <>
                    <Typography variant="h6" className={classes.titleText}>Configuration</Typography>
                    <Box mb={2}>
                        {renderConfigFields()}
                    </Box>
                </>
            )}

            <Typography variant="h6" className={classes.titleText}>Health Status</Typography>
            <FormControl fullWidth margin="normal">
                <InputLabel>Health Status</InputLabel>
                <Select
                    value={form.health_status || HealthStatus.HEALTHY}
                    onChange={(e) => handleHealthStatusChange(e.target.value as HealthStatus)}
                    disabled={!isEditMode}
                >
                    <MenuItem value={HealthStatus.HEALTHY}>Healthy</MenuItem>
                    <MenuItem value={HealthStatus.UNHEALTHY}>Unhealthy</MenuItem>
                    <MenuItem value={HealthStatus.UNKNOWN}>Unknown</MenuItem>
                </Select>
            </FormControl>

        </GenericFlexibleView>
    );
};

export default APIConfigFlexibleView;