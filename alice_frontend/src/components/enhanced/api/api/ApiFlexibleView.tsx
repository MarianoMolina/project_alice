import React, { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    TextField,
    Dialog,
} from '@mui/material';
import { ApiComponentProps, API, ApiType, ApiName, getDefaultApiForm } from '../../../../types/ApiTypes';
import { API_TYPE_CONFIGS, LLM_PROVIDERS } from '../../../../utils/ApiUtils';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import EnhancedModel from '../../model/model/EnhancedModel';
import { AliceModel } from '../../../../types/ModelTypes';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';

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
}) => {
    const { fetchItem } = useApi();
    const [form, setForm] = useState<Partial<API>>(getDefaultApiForm());
    const [availableApiNames, setAvailableApiNames] = useState<ApiName[]>([]);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        if (item) {
            setForm({ ...getDefaultApiForm(), ...item });
            updateAvailableApiNames(item.api_type);
        }
    }, [item]);

    useEffect(() => {
        if (form.api_type) {
            updateAvailableApiNames(form.api_type);
        }
    }, [form.api_type]);

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

    const isEditMode = mode === 'edit' || mode === 'create';
    const isCreateMode = mode === 'create';

    const updateAvailableApiNames = (apiType: ApiType | undefined) => {
        if (apiType && API_TYPE_CONFIGS[apiType]) {
            setAvailableApiNames(API_TYPE_CONFIGS[apiType].api_name);
        } else {
            setAvailableApiNames([]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onChange({ ...form, [name]: value });
    };

    const handleApiTypeChange = (newApiType: ApiType) => {
        const config = API_TYPE_CONFIGS[newApiType];
        updateAvailableApiNames(newApiType);
        onChange({
            ...form,
            api_type: newApiType,
            api_config: config.apiConfig,
            api_name: config.api_name[0],
        });
    };

    const handleApiNameChange = (newApiName: ApiName) => {
        onChange({
            ...form,
            api_name: newApiName,
            api_config: {
                ...form.api_config,
                base_url: getLlmProviderBaseUrl(newApiName),
                api_key: '',
            },
        });
    };

    const handleApiConfigChange = (key: string, value: string) => {
        onChange({
            ...form,
            api_config: { ...form.api_config, [key]: value }
        });
    };

    const handleDefaultModelChange = async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const model = await fetchItem('models', selectedIds[0]) as AliceModel;
            onChange({ ...form, default_model: model });
        } else {
            onChange({ ...form, default_model: undefined });
        }
    };

    const handleAccordionToggle = (accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    };

    const handleViewDetails = (type: 'model', itemId: string) => {
        setDialogContent(<EnhancedModel mode="card" itemId={itemId} fetchAll={false} />);
        setDialogOpen(true);
    };

    const title = mode === 'create' ? 'Create New API' : mode === 'edit' ? 'Edit API' : 'API Details';
    const saveButtonText = form._id ? 'Update API' : 'Create API';

    return (
        <GenericFlexibleView
            elementType='API'
            title={title}
            onSave={handleSave}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
        >
            {isCreateMode && (
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
            )}

            {form.api_type && (
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
            )}

            <TextField
                fullWidth
                name="name"
                label="API Display Name"
                value={form.name || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode}
            />

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

            {form.api_type === ApiType.LLM_MODEL && (
                <EnhancedSelect<AliceModel>
                    componentType="models"
                    EnhancedComponent={EnhancedModel}
                    selectedItems={form.default_model ? [form.default_model] : []}
                    onSelect={handleDefaultModelChange}
                    isInteractable={isEditMode}
                    label="Select Default Model"
                    activeAccordion={activeAccordion}
                    onAccordionToggle={handleAccordionToggle}
                    onView={(id) => handleViewDetails("model", id)}
                    accordionEntityName="default-model"
                />
            )}

            <FormControl fullWidth margin="normal">
                <InputLabel>Is Active</InputLabel>
                <Switch
                    checked={form.is_active || false}
                    onChange={(e) => onChange({ ...form, is_active: e.target.checked })}
                    disabled={!isEditMode}
                />
            </FormControl>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                {dialogContent}
            </Dialog>
        </GenericFlexibleView>
    );
};

export default ApiFlexibleView;