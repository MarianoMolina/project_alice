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
import { API_CAPABILITIES } from '../../../../utils/ApiUtils';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import ModelShortListView from '../../model/model/ModelShortListView';
import APIConfigShortListView from '../../api_config/api_config/APIConfigShortListView';
import { AliceModel } from '../../../../types/ModelTypes';
import { APIConfig } from '../../../../types/ApiConfigTypes';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import useStyles from '../ApiStyles';

const ApiFlexibleView: React.FC<ApiComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { fetchItem } = useApi();
    const [form, setForm] = useState<Partial<API>>(() => item || getDefaultApiForm());
    const [availableApiTypes, setAvailableApiTypes] = useState<ApiType[]>([]);
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

    function isModelApiType(apiType: ApiType): apiType is ApiType & ModelApiType {
        return Object.values(ModelApiType).includes(apiType as any);
    }

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    }, []);

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
                    <Typography variant="h6" className={classes.titleText}>API Name</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>API Name</InputLabel>
                        <Select
                            value={form.api_name || ''}
                            onChange={(e) => handleApiNameChange(e.target.value as ApiName)}
                        >
                            {Object.values(ApiName).map((name) => (
                                <MenuItem key={name} value={name}>{name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </>
            )}

            {form.api_name && (
                <>
                    <Typography variant="h6" className={classes.titleText}>API Type</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>API Type</InputLabel>
                        <Select
                            value={form.api_type || ''}
                            onChange={(e) => handleApiTypeChange(e.target.value as ApiType)}
                            disabled={!isEditMode}
                        >
                            {availableApiTypes.map((type) => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </>
            )}

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

            {form.api_name && (
                <>
                    <Typography variant="h6" className={classes.titleText}>Configuration</Typography>
                    <EnhancedSelect<APIConfig>
                        componentType="apiconfigs"
                        EnhancedView={APIConfigShortListView}
                        selectedItems={form.api_config ? [form.api_config] : []}
                        onSelect={handleApiConfigChange}
                        isInteractable={isEditMode}
                        label="API Configuration"
                        activeAccordion={activeAccordion}
                        onAccordionToggle={handleAccordionToggle}
                        accordionEntityName="api-config"
                        showCreateButton={true}
                        filters={{ api_name: form.api_name }}
                    />
                </>
            )}

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