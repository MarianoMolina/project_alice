import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    TextField,
    Typography,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    SelectChangeEvent,
} from '@mui/material';
import { AgentComponentProps, AliceAgent, getDefaultAgentForm } from '../../../../types/AgentTypes';
import { Prompt } from '../../../../types/PromptTypes';
import { AliceModel, ModelType } from '../../../../types/ModelTypes';
import { ToolPermission, CodePermission } from '../../../../types/AgentTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import PromptShortListView from '../../prompt/prompt/PromptShortListView';
import ModelShortListView from '../../model/model/ModelShortListView';
import { useApi } from '../../../../contexts/ApiContext';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import useStyles from '../AgentStyles';

const AgentFlexibleView: React.FC<AgentComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { fetchItem } = useApi();
    const { selectCardItem } = useCardDialog();
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<AliceAgent>>(item || getDefaultAgentForm());
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
        } else if (!item || Object.keys(item).length === 0)  {
            onChange(getDefaultAgentForm());
        }
    }, [item, onChange]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'max_consecutive_auto_reply') {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue >= 0) {
                setForm(prevForm => ({ ...prevForm, [name]: numValue }));
            }
        } else {
            setForm(prevForm => ({ ...prevForm, [name]: value }));
        }
    }, []);

    const handleSelectChange = useCallback((e: SelectChangeEvent) => {
        const { name, value } = e.target;
        if (name) {
            const numericValue = parseInt(value as string, 10);
            setForm(prevForm => ({ ...prevForm, [name]: numericValue }));
        }
    }, []);

    const handleModelChange = useCallback(async (selectedIds: string[]) => {
        const updatedModels: { [key in ModelType]?: AliceModel } = {};
        for (const id of selectedIds) {
            const model = await fetchItem('models', id) as AliceModel;
            if (model && model.model_type) {
                updatedModels[model.model_type] = model;
            }
        }
        setForm(prevForm => ({ ...prevForm, models: updatedModels }));
    }, [fetchItem]);

    const handlePromptChange = useCallback(async (selectedIds: string[]) => {
        let updatedSystemMessage: Prompt | undefined;
        if (selectedIds.length > 0) {
            updatedSystemMessage = await fetchItem('prompts', selectedIds[0]) as Prompt;
        }
        setForm(prevForm => ({ ...prevForm, system_message: updatedSystemMessage }));
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

    const title = mode === 'create' ? 'Create New Agent' : mode === 'edit' ? 'Edit Agent' : 'Agent Details';
    const saveButtonText = form._id ? 'Update Agent' : 'Create Agent';

    Logger.debug('AgentFlexibleView', { form, mode });

    const memoizedPromptSelect = useMemo(() => (
        <EnhancedSelect<Prompt>
            componentType="prompts"
            EnhancedView={PromptShortListView}
            selectedItems={form.system_message ? [form.system_message] : []}
            onSelect={handlePromptChange}
            isInteractable={isEditMode}
            label="Select System Message" 
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            onView={(id) => selectCardItem("Prompt", id)}
            accordionEntityName="system-message"
        />
    ), [form.system_message, handlePromptChange, isEditMode, activeAccordion, handleAccordionToggle, selectCardItem]);

    const memoizedModelSelect = useMemo(() => (
        <EnhancedSelect<AliceModel>
            componentType="models"
            EnhancedView={ModelShortListView}
            selectedItems={form.models ? Object.values(form.models) : []}
            onSelect={handleModelChange}
            isInteractable={isEditMode}
            multiple
            label="Select Models"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            onView={(id) => selectCardItem("Model", id)}
            accordionEntityName="models"
        />
    ), [form.models, handleModelChange, isEditMode, activeAccordion, handleAccordionToggle, selectCardItem]);

    return (
        <GenericFlexibleView
            elementType='Agent'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as AliceAgent}
            itemType='agents'
        >
            <Typography variant="h6" className={classes.titleText}>Name</Typography>
            <TextField
                fullWidth
                name="name"
                label="Name"
                value={form.name || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode}
            />
            <Typography variant="h6" className={classes.titleText}>System Message</Typography>
            {memoizedPromptSelect}
            <Typography variant="h6" className={classes.titleText}>Models</Typography>
            {memoizedModelSelect}
            <Typography variant="h6" className={classes.titleText}>Max Consecutive Replies</Typography>
            <TextField
                fullWidth
                name="max_consecutive_auto_reply"
                type='number'
                label="Max Consecutive Auto Reply"
                value={form.max_consecutive_auto_reply || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode}
            />
            <Typography variant="h6" className={classes.titleText}>Tool Execution</Typography>
            <FormControl fullWidth margin="normal">
                <InputLabel>Tool Permission</InputLabel>
                <Select
                    name="has_tools"
                    value={form.has_tools?.toString() ?? ToolPermission.DISABLED.toString()}
                    onChange={handleSelectChange}
                    disabled={!isEditMode}
                    label="Tool Permission"
                >
                    <MenuItem value={ToolPermission.NORMAL.toString()}>Normal</MenuItem>
                    <MenuItem value={ToolPermission.DISABLED.toString()}>Disabled</MenuItem>
                    <MenuItem value={ToolPermission.WITH_PERMISSION.toString()}>With Permission</MenuItem>
                    <MenuItem value={ToolPermission.DRY_RUN.toString()}>Dry Run</MenuItem>
                </Select>
            </FormControl>
            <Typography variant="h6" className={classes.titleText}>Code Execution</Typography>
            <FormControl fullWidth margin="normal">
                <InputLabel>Code Permission</InputLabel>
                <Select
                    name="has_code_exec"
                    value={form.has_code_exec?.toString() ?? CodePermission.NORMAL.toString()}
                    onChange={handleSelectChange}
                    disabled={!isEditMode}
                    label="Code Permission"
                >
                    <MenuItem value={CodePermission.NORMAL.toString()}>Normal</MenuItem>
                    <MenuItem value={CodePermission.DISABLED.toString()}>Disabled</MenuItem>
                    <MenuItem value={CodePermission.WITH_PERMISSION.toString()}>With Permission</MenuItem>
                    <MenuItem value={CodePermission.TAGGED_ONLY.toString()}>Tagged Only</MenuItem>
                </Select>
            </FormControl>
        </GenericFlexibleView>
    );
};

export default AgentFlexibleView;