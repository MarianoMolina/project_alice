import React, { useState, useCallback, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { ApiComponentProps, API, ApiType, ApiName, getDefaultApiForm, ModelApiType } from '../../../../types/ApiTypes';
import { API_TYPE_CONFIGS, LLM_PROVIDERS } from '../../../../utils/ApiUtils';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import ModelShortListView from '../../model/model/ModelShortListView';
import { AliceModel } from '../../../../types/ModelTypes';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import useStyles from '../ApiStyles';

const getLlmProviderBaseUrl = (apiName: ApiName): string => {
    for (const provider of Object.values(LLM_PROVIDERS)) {
        if (provider.api_name.includes(apiName)) {
            return provider.baseUrl;
        }
    }
    return '';
};

const ApiFlexibleView: React.FC<ApiComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { fetchItem } = useApi();
    const [form, setForm] = useState<Partial<API>>(() => item || getDefaultApiForm());
    const [availableApiNames, setAvailableApiNames] = useState<ApiName[]>([]);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    const isEditMode = mode === 'edit' || mode === 'create';
    const isCreateMode = mode === 'create';
    const [isSaving, setIsSaving] = useState(false);
    const classes = useStyles();

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
            onChange(getDefaultApiForm());
        }
    }, [item, onChange]);

    const updateAvailableApiNames = useCallback((apiType: ApiType | undefined) => {
        Logger.debug('updateAvailableApiNames', apiType);
        if (apiType && API_TYPE_CONFIGS[apiType]) {
            setAvailableApiNames(API_TYPE_CONFIGS[apiType].api_name);
        } else {
            setAvailableApiNames([]);
        }
    }, []);

    useEffect(() => {
        if (form.api_type) {
            updateAvailableApiNames(form.api_type);
        }
    }, [form.api_type, updateAvailableApiNames]);
    
    function isModelApiType(apiType: ApiType): apiType is ApiType & ModelApiType {
        return Object.values(ModelApiType).includes(apiType as any);
    }

    useEffect(() => {
        if (form.api_name) {
            const baseUrl = getLlmProviderBaseUrl(form.api_name);
            if (baseUrl) {
                setForm(prevForm => ({
                    ...prevForm,
                    api_config: {
                        ...prevForm.api_config,
                        base_url: baseUrl,
                    },
                }));
            }
        }
    }, [form.api_name]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    }, []);

    const handleApiNameChange = useCallback((newApiName: ApiName) => {
        setForm(prevForm => ({
            ...prevForm,
            api_name: newApiName,
            api_config: {
                ...prevForm.api_config,
                base_url: getLlmProviderBaseUrl(newApiName),
                api_key: '',
            },
        }));
    }, []);

    const handleApiTypeChange = useCallback((newApiType: ApiType) => {
        const config = API_TYPE_CONFIGS[newApiType];
        updateAvailableApiNames(newApiType);
        setForm(prevForm => ({
            ...prevForm,
            api_type: newApiType,
            api_config: config.apiConfig,
            api_name: config.api_name[0],
        }));
    }, [updateAvailableApiNames]);

    const handleHealthStatusChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
        const value = event.target.value as API['health_status'];
        setForm(prevForm => ({
            ...prevForm,
            health_status: value
        }));
    }, []);

    const handleApiConfigChange = useCallback((key: string, value: string) => {
        setForm(prevForm => ({
            ...prevForm,
            api_config: { ...prevForm.api_config, [key]: value }
        }));
    }, []);

    const handleDefaultModelChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const model = await fetchItem('models', selectedIds[0]) as AliceModel;
            setForm(prevForm => ({ ...prevForm, default_model: model }));
        } else {
            setForm(prevForm => ({ ...prevForm, default_model: undefined }));
        }
    }, [fetchItem]);

    const handleAccordionToggle = useCallback((accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    }, []);

    const handleLocalSave = useCallback(() => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);

    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const title = mode === 'create' ? 'Create New API' : mode === 'edit' ? 'Edit API' : 'API Details';
    const saveButtonText = form._id ? 'Update API' : 'Create API';

    return (
        <GenericFlexibleView
            elementType='API'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as API}
            itemType='apis'
        >
            {isCreateMode && (
                <>
                    <Typography variant="h6" className={classes.titleText}>API Type</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>API Type</InputLabel>
                        <Select
                            value={form.api_type || ''}
                            onChange={(e) => handleApiTypeChange(e.target.value as ApiType)}
                        >
                            {Object.values(ApiType).map((type) => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </>
            )}
            
            <Typography variant="h6" className={classes.titleText}>Name</Typography>
            <FormControl fullWidth margin="normal">
                <InputLabel>API Name</InputLabel>
                <Select
                    value={form.api_name || ''}
                    onChange={(e) => handleApiNameChange(e.target.value as ApiName)}
                    disabled={!isEditMode}
                >
                    {availableApiNames.map((name) => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Typography variant="h6" className={classes.titleText}>Display Name</Typography>
            <TextField
                fullWidth
                name="name"
                label="API Display Name"
                value={form.name || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode}
            />

            <Typography variant="h6" className={classes.titleText}>Health Status</Typography>
            <FormControl fullWidth margin="normal">
                <InputLabel>Health Status</InputLabel>
                <Select
                    value={form.health_status || 'unknown'}
                    onChange={handleHealthStatusChange}
                    disabled={!isEditMode}
                >
                    <MenuItem value="healthy">Healthy</MenuItem>
                    <MenuItem value="unhealthy">Unhealthy</MenuItem>
                    <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
            </FormControl>

            <Typography variant="h6" className={classes.titleText}>Configuration</Typography>
            {form.api_config && Object.entries(form.api_config).map(([key, value]) => (
                <TextField
                    key={key}
                    fullWidth
                    label={key}
                    type="text"
                    value={value || ''}
                    onChange={(e) => handleApiConfigChange(key, e.target.value)}
                    margin="normal"
                    disabled={!isEditMode}
                />
            ))}

            {form.api_type && isModelApiType(form.api_type) && (
                <>
                    <Typography variant="h6" className={classes.titleText}>Default Model</Typography>
                    <EnhancedSelect<AliceModel>
                        componentType="models"
                        EnhancedView={ModelShortListView}
                        selectedItems={form.default_model ? [form.default_model] : []}
                        onSelect={handleDefaultModelChange}
                        isInteractable={isEditMode}
                        label="Select Default Model"
                        activeAccordion={activeAccordion}
                        onAccordionToggle={handleAccordionToggle}
                        accordionEntityName="default-model"
                        showCreateButton={true}
                    />
                </>
            )}

            <Typography variant="h6" className={classes.titleText}>Active?</Typography>
            <FormControl fullWidth margin="normal">
                <InputLabel>Is Active</InputLabel>
                <Switch
                    checked={form.is_active || false}
                    onChange={(e) => onChange({ ...form, is_active: e.target.checked })}
                    disabled={!isEditMode}
                />
            </FormControl>

        </GenericFlexibleView>
    );
};

export default ApiFlexibleView;