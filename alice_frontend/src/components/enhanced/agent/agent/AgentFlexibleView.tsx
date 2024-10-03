import React, { useState, useCallback } from 'react';
import {
    TextField,
    FormControlLabel,
    Switch,
    Dialog,
} from '@mui/material';
import { AgentComponentProps, AliceAgent, getDefaultAgentForm } from '../../../../types/AgentTypes';
import { Prompt } from '../../../../types/PromptTypes';
import { AliceModel, ModelType } from '../../../../types/ModelTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import EnhancedModel from '../../model/model/EnhancedModel';
import EnhancedPrompt from '../../prompt/prompt/EnhancedPrompt';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';

const AgentFlexibleView: React.FC<AgentComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    const { fetchItem } = useApi();
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<AliceAgent>>(item || getDefaultAgentForm());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);

    const isEditMode = mode === 'edit' || mode === 'create';

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'max_consecutive_auto_reply') {
            // Only allow non-negative integers
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue >= 0) {
                setForm(prevForm => ({ ...prevForm, [name]: numValue }));
            }
        } else {
            setForm(prevForm => ({ ...prevForm, [name]: value }));
        }
    }, []);    

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: checked }));
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

    const handleViewDetails = useCallback((type: 'agent' | 'model' | 'prompt', itemId: string) => {
        let content;
        switch (type) {
            case 'model':
                content = <EnhancedModel mode="card" itemId={itemId} fetchAll={false} />;
                break;
            case 'prompt':
                content = <EnhancedPrompt mode="card" itemId={itemId} fetchAll={false} />;
                break;
        }
        setDialogContent(content);
        setDialogOpen(true);
    }, []);

    const handleLocalSave = useCallback(() => {
        onChange(form);
        handleSave();
    }, [form, onChange, handleSave]);

    const title = mode === 'create' ? 'Create New Agent' : mode === 'edit' ? 'Edit Agent' : 'Agent Details';
    const saveButtonText = form._id ? 'Update Agent' : 'Create Agent';

    Logger.debug('AgentFlexibleView', { form, mode });

    return (
        <GenericFlexibleView
            elementType='Agent'
            title={title}
            onSave={handleLocalSave}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
        >
            <TextField
                fullWidth
                name="name"
                label="Name"
                value={form.name || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode}
            />
            <EnhancedSelect<Prompt>
                componentType="prompts"
                EnhancedComponent={EnhancedPrompt}
                selectedItems={form.system_message ? [form.system_message] : []}
                onSelect={handlePromptChange}
                isInteractable={isEditMode}
                label="Select System Message"
                activeAccordion={activeAccordion}
                onAccordionToggle={handleAccordionToggle}
                onView={(id) => handleViewDetails("prompt", id)}
                accordionEntityName="system-message"
            />
            <EnhancedSelect<AliceModel>
                componentType="models"
                EnhancedComponent={EnhancedModel}
                selectedItems={form.models ? Object.values(form.models) : []}
                onSelect={handleModelChange}
                isInteractable={isEditMode}
                multiple
                label="Select Models"
                activeAccordion={activeAccordion}
                onAccordionToggle={handleAccordionToggle}
                onView={(id) => handleViewDetails("model", id)}
                accordionEntityName="models"
            />
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
            <FormControlLabel
                control={
                    <Switch
                        name="has_code_exec"
                        checked={form.has_code_exec || false}
                        onChange={handleCheckboxChange}
                        disabled={!isEditMode}
                    />
                }
                label="Execute Code"
            />
            <FormControlLabel
                control={
                    <Switch
                        name="has_functions"
                        checked={form.has_functions || false}
                        onChange={handleCheckboxChange}
                        disabled={!isEditMode}
                    />
                }
                label="Has Functions"
            />
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                {dialogContent}
            </Dialog>
        </GenericFlexibleView>
    );
};

export default AgentFlexibleView;