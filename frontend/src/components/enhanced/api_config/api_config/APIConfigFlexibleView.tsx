import React, { useState, useCallback, useEffect } from 'react';
import {
    Alert,
} from '@mui/material';
import { APIConfigComponentProps, APIConfig, getDefaultAPIConfigForm, HealthStatus } from '../../../../types/ApiConfigTypes';
import { ApiName } from '../../../../types/ApiTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import { API_BASE_URLS, apiNameIcons } from '../../../../utils/ApiUtils';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { TextInput } from '../../common/inputs/TextInput';
import { SelectInput } from '../../common/inputs/SelectInput';
import { IconSelectInput } from '../../common/inputs/IconSelectInput';
import TitleBox from '../../common/inputs/TitleBox';

const APIConfigFlexibleView: React.FC<APIConfigComponentProps> = ({
    item,
    onChange,
    mode, 
    handleSave,
    handleDelete,
}) => {
    const [form, setForm] = useState<Partial<APIConfig>>((item || getDefaultAPIConfigForm()));
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const isCreateMode = mode === 'create';
    const isEditMode = mode === 'edit' || mode === 'create';

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

    const handleFieldChange = useCallback((field: keyof APIConfig, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
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

    const handleDataChange = useCallback((field: string, value: string | undefined) => {
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
            case ApiName.DEEPSEEK:
            case ApiName.AZURE:
            case ApiName.LM_STUDIO:
            case ApiName.CUSTOM:
                return (
                    <>
                        <TextInput
                            name='api_key'
                            label='API Key'
                            value={data.api_key || ''}
                            onChange={(value) => handleDataChange('api_key', value)}
                            disabled={!isEditMode}
                            fullWidth
                        />
                        <TextInput
                            name='base_url'
                            label='Base URL'
                            value={data.base_url || ''}
                            onChange={(value) => handleDataChange('base_url', value)}
                            disabled={!isEditMode}
                            fullWidth
                        />
                    </>
                );
            case ApiName.GOOGLE_SEARCH:
                return (
                    <>
                        <TextInput
                            name='api_key'
                            label='API Key'
                            value={data.api_key || ''}
                            onChange={(value) => handleDataChange('api_key', value)}
                            disabled={!isEditMode}
                            fullWidth
                        />
                        <TextInput
                            name='cse_id'
                            label='CSE ID'
                            value={data.cse_id || ''}
                            onChange={(value) => handleDataChange('cse_id', value)}
                            disabled={!isEditMode}
                            fullWidth
                        />
                    </>
                );
            case ApiName.REDDIT:
                return (
                    <>
                        <TextInput
                            name='client_id'
                            label='Client ID'
                            value={data.client_id || ''}
                            onChange={(value) => handleDataChange('client_id', value)}
                            disabled={!isEditMode}
                            fullWidth
                        />
                        <TextInput
                            name='client_secret'
                            label='Client Secret'
                            value={data.client_secret || ''}
                            onChange={(value) => handleDataChange('client_secret', value)}
                            disabled={!isEditMode}
                            fullWidth
                        />
                    </>
                );
            case ApiName.WOLFRAM_ALPHA:
                return (
                    <TextInput
                        name='app_id'
                        label='App ID'
                        value={data.app_id || ''}
                        onChange={(value) => handleDataChange('app_id', value)}
                        disabled={!isEditMode}
                        fullWidth
                    />
                );
            case ApiName.EXA:
            case ApiName.GOOGLE_KNOWLEDGE_GRAPH:
                return (
                    <TextInput
                        name='api_key'
                        label='API Key'
                        value={data.api_key || ''}
                        onChange={(value) => handleDataChange('api_key', value)}
                        disabled={!isEditMode}
                        fullWidth
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
            elementType='API Config'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            mode={mode}
            item={form as APIConfig}
            itemType='apiconfigs'
        >
            {validationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {validationError}
                </Alert>
            )}
            <TextInput
                name='name'
                label='Config Name'
                value={form.name || ''}
                onChange={(value) => handleFieldChange('name', value)}
                disabled={!isEditMode}
                description='Enter a name for the API configuration'
                fullWidth
            />
            <IconSelectInput
                name='api_name'
                label='API Name'
                value={form.api_name || ''}
                onChange={(apiName) => handleApiNameChange(apiName as ApiName)}
                options={Object.values(ApiName).map((name) => ({ value: name, label: formatCamelCaseString(name), icon: apiNameIcons[name] }))}
                description='Select the name of the API you want to create'
                disabled={!isCreateMode}
                fullWidth
                required
            />
            <SelectInput
                name='health_status'
                label='Health Status'
                value={form.health_status || HealthStatus.HEALTHY}
                onChange={(status) => handleFieldChange('health_status', status)}
                options={Object.values(HealthStatus).map((status) => ({ value: status, label: formatCamelCaseString(status) }))}
                description='Select the health status of the API'
                disabled={!isEditMode}
                fullWidth
                required
            />

            {form.api_name && (
                <TitleBox title='API Configuration'>
                    {renderConfigFields()}
                </TitleBox>
            )}

        </GenericFlexibleView>
    );
};

export default APIConfigFlexibleView;