import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    AgentComponentProps,
    AliceAgent,
    getDefaultAgentForm,
    ToolPermission,
    CodePermission
} from '../../../../types/AgentTypes';
import { Prompt } from '../../../../types/PromptTypes';
import { AliceModel, ModelType } from '../../../../types/ModelTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import PromptShortListView from '../../prompt/prompt/PromptShortListView';
import ModelShortListView from '../../model/model/ModelShortListView';
import { useApi } from '../../../../contexts/ApiContext';
import { useDialog } from '../../../../contexts/DialogContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import { TextInput } from '../../common/inputs/TextInput';
import { SelectInput } from '../../common/inputs/SelectInput';
import { NumericInput } from '../../common/inputs/NumericInput';
import TitleBox from '../../common/inputs/TitleBox';

// Helper to convert enum to selection options
const enumToOptions = (enumObj: Record<string, string | number>) =>
    Object.entries(enumObj)
        .filter(([key]) => isNaN(Number(key))) // Filter out numeric keys
        .map(([_, value]) => ({
            value: value.toString(),
            label: value.toString()
        }));

const AgentFlexibleView: React.FC<AgentComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { fetchPopulatedItem } = useApi();
    const { selectCardItem } = useDialog();
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<AliceAgent>>(item || getDefaultAgentForm());
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Agent' : mode === 'edit' ? 'Edit Agent' : 'Agent Details';
    const saveButtonText = form._id ? 'Update Agent' : 'Create Agent';

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
            onChange(getDefaultAgentForm());
        }
    }, [item, onChange]);

    const handleFieldChange = useCallback((field: keyof AliceAgent, value: any) => {
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

    const handleModelChange = useCallback(async (selectedIds: string[]) => {
        const updatedModels: { [key in ModelType]?: AliceModel } = {};
        for (const id of selectedIds) {
            const model = await fetchPopulatedItem('models', id) as AliceModel;
            if (model && model.model_type) {
                updatedModels[model.model_type] = model;
            }
        }
        setForm(prevForm => ({ ...prevForm, models: updatedModels }));
    }, [fetchPopulatedItem]);

    const handlePromptChange = useCallback(async (selectedIds: string[]) => {
        let updatedSystemMessage: Prompt | undefined;
        if (selectedIds.length > 0) {
            updatedSystemMessage = await fetchPopulatedItem('prompts', selectedIds[0]) as Prompt;
        }
        setForm(prevForm => ({ ...prevForm, system_message: updatedSystemMessage }));
    }, [fetchPopulatedItem]);

    const handleAccordionToggle = useCallback((accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    }, []);

    // Convert enums to selection options
    const toolPermissionOptions = useMemo(() => enumToOptions(ToolPermission), []);
    const codePermissionOptions = useMemo(() => enumToOptions(CodePermission), []);

    // Memoized selects for database items
    const memoizedPromptSelect = useMemo(() => (
        <EnhancedSelect<Prompt>
            componentType="prompts"
            EnhancedView={PromptShortListView}
            selectedItems={form.system_message ? [form.system_message] : []}
            onSelect={handlePromptChange}
            isInteractable={isEditMode}
            label="Select System Message"
            activeAccordion={activeAccordion}
            description='The system message that the agent will use to respond to the user.'
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
            description='The models that the agent will use to respond to the user. Can have one model per model type.'
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
            mode={mode}
            item={item as AliceAgent}
            itemType='agents'
        >
            <TextInput
                name="name"
                label="Name"
                value={form.name}
                onChange={(value) => handleFieldChange('name', value)}
                disabled={!isEditMode}
                required
                description="The display name of the agent."
                fullWidth
            />
            {memoizedPromptSelect}
            {memoizedModelSelect}
            <TitleBox title="Agent Configuration" >
                <NumericInput
                    name="max_consecutive_auto_reply"
                    label="Max Consecutive Auto Reply"
                    value={form.max_consecutive_auto_reply}
                    onChange={(value) => handleFieldChange('max_consecutive_auto_reply', value)}
                    disabled={!isEditMode}
                    required
                    isInteger
                    description='The maximum number of consecutive auto replies the agent can send. If > 1, if the agent produces tool calls or code executions, it will continue responding until the max is reached.'
                    min={0}
                    fullWidth
                />
                <SelectInput
                    name="has_tools"
                    label="Tool Permission"
                    value={form.has_tools?.toString()}
                    onChange={(value) => handleFieldChange('has_tools', Number(value))}
                    options={toolPermissionOptions}
                    disabled={!isEditMode}
                    description='The permission level for tool execution. 0: Disabled, 1: Normal, 2: With Permission, 3: Dry Run'
                    fullWidth
                    required
                />
                <SelectInput
                    name="has_code_exec"
                    label="Code Permission"
                    value={form.has_code_exec?.toString()}
                    onChange={(value) => handleFieldChange('has_code_exec', Number(value))}
                    options={codePermissionOptions}
                    disabled={!isEditMode}
                    description='The permission level for code execution. 0: Disabled, 1: Normal, 2: With Permission, 3: Tagged Only'
                    fullWidth
                    required
                />
            </TitleBox>
        </GenericFlexibleView>
    );
};

export default AgentFlexibleView;