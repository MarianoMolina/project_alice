import React, { useState, useCallback, useEffect } from 'react';
import { ApiComponentProps, API, ApiType, ApiName, getDefaultApiForm } from '../../../../types/ApiTypes';
import { API_CAPABILITIES, apiNameIcons, apiTypeIcons, isModelApiType } from '../../../../utils/ApiUtils';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import ModelShortListView from '../../model/model/ModelShortListView';
import APIConfigShortListView from '../../api_config/api_config/APIConfigShortListView';
import { AliceModel } from '../../../../types/ModelTypes';
import { APIConfig } from '../../../../types/ApiConfigTypes';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { TextInput } from '../../common/inputs/TextInput';
import { BooleanInput } from '../../common/inputs/BooleanInput';
import { IconSelectInput } from '../../common/inputs/IconSelectInput';

const ApiFlexibleView: React.FC<ApiComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { fetchItem } = useApi();
    const [availableApiTypes, setAvailableApiTypes] = useState<ApiType[]>([]);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<API>>(() => item || getDefaultApiForm());
    const [isSaving, setIsSaving] = useState(false);
    
    const isCreateMode = mode === 'create';
    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New API' : mode === 'edit' ? 'Edit API' : 'API Details';
    const saveButtonText = form._id ? 'Update API' : 'Create API';

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

    const handleFieldChange = useCallback((field: keyof API, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
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

    const handleAccordionToggle = useCallback((accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    }, []);

    const updateAvailableApiTypes = useCallback((apiName: ApiName | undefined) => {
        Logger.debug('updateAvailableApiTypes', apiName);
        if (apiName && apiName in API_CAPABILITIES) {
            const capabilities = API_CAPABILITIES[apiName];
            setAvailableApiTypes(Array.from(capabilities));
        } else {
            setAvailableApiTypes([]);
        }
    }, []);

    useEffect(() => {
        if (form.api_name) {
            updateAvailableApiTypes(form.api_name);
        }
    }, [form.api_name, updateAvailableApiTypes]);

    const handleApiNameChange = useCallback((newApiName: ApiName) => {
        setForm(prevForm => ({
            ...prevForm,
            api_name: newApiName,
            api_type: Array.from(API_CAPABILITIES[newApiName])[0], // Set first available capability as default
            api_config: undefined // Reset config when API changes
        }));
    }, []);

    const handleApiTypeChange = useCallback((newApiType: ApiType) => {
        setForm(prevForm => ({
            ...prevForm,
            api_type: newApiType,
        }));
    }, []);

    const handleApiConfigChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const config = await fetchItem('apiconfigs', selectedIds[0]) as APIConfig;
            setForm(prevForm => ({ ...prevForm, api_config: config }));
        } else {
            setForm(prevForm => ({ ...prevForm, api_config: undefined }));
        }
    }, [fetchItem]);

    const handleDefaultModelChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const model = await fetchItem('models', selectedIds[0]) as AliceModel;
            setForm(prevForm => ({ ...prevForm, default_model: model }));
        } else {
            setForm(prevForm => ({ ...prevForm, default_model: undefined }));
        }
    }, [fetchItem]);

    const apiOptions = Object.values(ApiName).map((name) => ({
        value: name,
        label: formatCamelCaseString(name),
        icon: apiNameIcons[name],
    }));

    const apiTypes = availableApiTypes.map((type) => ({
        value: type,
        label: formatCamelCaseString(type),
        icon: apiTypeIcons[type],
    }));

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
                <IconSelectInput
                    value={form.api_name || ''}
                    onChange={(apiName) => handleApiNameChange(apiName as ApiName)}
                    name="api_name"
                    label="API Name"
                    options={apiOptions}
                    description='Select the name of the API you want to create'
                />
            )}

            {form.api_name && (
                <IconSelectInput
                    value={form.api_type || ''}
                    onChange={(apiType) => handleApiTypeChange(apiType as ApiType)}
                    name="api_type"
                    label="API Type"
                    options={apiTypes}
                    disabled={!isEditMode}
                    description='Select the type of API'
                />
            )}
            <TextInput
                name="name"
                label="API Display Name"
                value={form.name || ''}
                onChange={(value) => handleFieldChange('name', value)}
                disabled={!isEditMode}
                description='Enter a description for the API'
            />

            {form.api_name && (
                <EnhancedSelect<APIConfig>
                    componentType="apiconfigs"
                    EnhancedView={APIConfigShortListView}
                    selectedItems={form.api_config ? [form.api_config] : []}
                    onSelect={handleApiConfigChange}
                    isInteractable={isEditMode}
                    label="API Configuration"
                    activeAccordion={activeAccordion}
                    description='Select the configuration for this API'
                    onAccordionToggle={handleAccordionToggle}
                    accordionEntityName="api-config"
                    showCreateButton={true}
                    filters={{ api_name: form.api_name }}
                />
            )}

            {form.api_type && isModelApiType(form.api_type) && (
                <EnhancedSelect<AliceModel>
                    componentType="models"
                    EnhancedView={ModelShortListView}
                    selectedItems={form.default_model ? [form.default_model] : []}
                    onSelect={handleDefaultModelChange}
                    isInteractable={isEditMode}
                    label="Select Default Model"
                    activeAccordion={activeAccordion}
                    description='Select the default model for this API'
                    onAccordionToggle={handleAccordionToggle}
                    accordionEntityName="default-model"
                    showCreateButton={true}
                />
            )}
            <BooleanInput
                name="is_active"
                label="Is Active"
                value={form.is_active || false}
                onChange={(value) => handleFieldChange('is_active', value)}
                disabled={!isEditMode}
                description='Is this API active?'
            />
        </GenericFlexibleView>
    );
};

export default ApiFlexibleView;