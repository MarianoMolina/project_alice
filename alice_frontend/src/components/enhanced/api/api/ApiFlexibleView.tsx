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
import { ApiComponentProps, API, ApiType, getDefaultApiForm, LlmProvider } from '../../../../types/ApiTypes';
import { API_TYPE_CONFIGS, LLM_PROVIDERS, isLlmApi, getAvailableApiTypes } from '../../../../utils/ApiUtils';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import EnhancedModel from '../../model/model/EnhancedModel';
import { AliceModel } from '../../../../types/ModelTypes';
import { useApi } from '../../../../context/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';

const ApiFlexibleView: React.FC<ApiComponentProps> = ({
    items,
    item,
    onChange,
    mode,
    handleSave,
    apiType
}) => {
    const { fetchItem } = useApi();
    const [form, setForm] = useState<Partial<API>>(getDefaultApiForm());
    const [availableApiTypes, setAvailableApiTypes] = useState<ApiType[]>([]);
    const [llmProvider, setLlmProvider] = useState<string>('');
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        if (items) {
            setAvailableApiTypes(getAvailableApiTypes(items));
        }
    }, [items]);

    useEffect(() => {
        if (item) {
            setForm({ ...getDefaultApiForm(), ...item });
            if (isLlmApi(item.api_type) && item.api_config && item.api_config.base_url) {
                const provider = Object.entries(LLM_PROVIDERS).find(([_, config]) => config.baseUrl === item.api_config.base_url);
                setLlmProvider(provider ? provider[0] : 'Custom');
            }
        }
    }, [item]);

    const isEditMode = mode === 'edit' || mode === 'create';
    const isCreateMode = mode === 'create';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onChange({ ...form, [name]: value });
    };

    const handleApiTypeChange = (newApiType: ApiType) => {
        const config = API_TYPE_CONFIGS[newApiType];
        onChange({
            ...form,
            api_type: newApiType,
            api_config: config.apiConfig,
            api_name: config.api_name as LlmProvider,
        });
        setLlmProvider('');
    };

    const handleLlmProviderChange = (provider: string) => {
        setLlmProvider(provider);
        if (provider !== 'Custom' && provider in LLM_PROVIDERS) {
            onChange({
                ...form,
                api_config: {
                    ...form.api_config,
                    base_url: LLM_PROVIDERS[provider as keyof typeof LLM_PROVIDERS].baseUrl,
                    api_key: '',
                },
                api_name: LLM_PROVIDERS[provider as keyof typeof LLM_PROVIDERS].api_name,
            });
        }
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
                        {availableApiTypes.map((type) => (
                            <MenuItem key={type} value={type}>{API_TYPE_CONFIGS[type].api_name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {form.api_type && isLlmApi(form.api_type) && isCreateMode && (
                <FormControl fullWidth margin="normal">
                    <InputLabel>LLM Provider</InputLabel>
                    <Select
                        value={llmProvider}
                        onChange={(e) => handleLlmProviderChange(e.target.value)}
                    >
                        {Object.entries(LLM_PROVIDERS).map(([key, config]) => (
                            <MenuItem key={key} value={key}>{config.api_name}</MenuItem>
                        ))}
                        <MenuItem value="Custom">Custom</MenuItem>
                    </Select>
                </FormControl>
            )}

            <TextField
                fullWidth
                name="name"
                label="API Name"
                value={form.api_name || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode || (form.api_type && (isLlmApi(form.api_type) && llmProvider !== 'Custom'))}
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
                    disabled={!isEditMode || (key === 'base_url' && form.api_type && isLlmApi(form.api_type) && llmProvider !== 'Custom')}
                />
            ))}

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