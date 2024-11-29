import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Box,
    Alert,
} from '@mui/material';
import { ChatComponentProps, AliceChat, getDefaultChatForm, CheckpointType } from '../../../../types/ChatTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import AgentShortListView from '../../agent/agent/AgentShortListView';
import TaskShortListView from '../../task/task/TaskShortListView';
import { AliceAgent } from '../../../../types/AgentTypes';
import { AliceTask } from '../../../../types/TaskTypes';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import MessageListView from '../../message/message/MessageListView';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import Logger from '../../../../utils/Logger';
import DataClusterManager from '../../data_cluster/data_cluster_manager/DataClusterManager';
import { UserCheckpoint } from '../../../../types/UserCheckpointTypes';
import UserCheckpointShortListView from '../../user_checkpoint/user_checkpoint/UserCheckpointShortListView';
import { useAuth } from '../../../../contexts/AuthContext';
import { DataCluster } from '../../../../types/DataClusterTypes';
import { TextInput } from '../../common/inputs/TextInput';

const ChatFlexibleView: React.FC<ChatComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { fetchItem } = useApi();
    const { selectCardItem } = useCardDialog();
    const { user } = useAuth();
    const [form, setForm] = useState<Partial<AliceChat>>(item || getDefaultChatForm());
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Chat' : mode === 'edit' ? 'Edit Chat' : 'Chat Details';
    const saveButtonText = form._id ? 'Update Chat' : 'Create Chat';

    useEffect(() => {
        populateConfig();
    }, [item, onChange, user, mode, fetchItem]);

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    const handleFieldChange = useCallback((field: keyof AliceAgent, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
    }, []);
    
    const validateForm = useCallback(() => {
        if (!form.name) {
            setValidationError('Chat name is required');
            return false;
        }

        if (!form.default_user_checkpoints) {
            setValidationError('Both Tool Call and Code Execution checkpoints are required');
            return false;
        }

        const hasToolCall = !!form.default_user_checkpoints[CheckpointType.TOOL_CALL];
        const hasCodeExec = !!form.default_user_checkpoints[CheckpointType.CODE_EXECUTION];

        if (!hasToolCall || !hasCodeExec) {
            setValidationError('Both Tool Call and Code Execution checkpoints are required');
            return false;
        }

        setValidationError(null);
        return true;
    }, [form.default_user_checkpoints, form.name]);
    
    const handleLocalSave = useCallback(() => {
        if (validateForm()) {
            onChange(form);
            setIsSaving(true);
        }
    }, [form, onChange, validateForm]);

    const handleLocalDelete = useCallback(() => {
        Logger.debug('ChatFlexibleView handleLocalDelete', { item, handleDelete });
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);
    
    const handleAccordionToggle = useCallback((accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    }, []);

    const handleAgentChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const agent = await fetchItem('agents', selectedIds[0]) as AliceAgent;
            setForm(prevForm => ({ ...prevForm, alice_agent: agent }));
        } else {
            setForm(prevForm => ({ ...prevForm, alice_agent: undefined }));
        }
    }, [fetchItem]);

    const handleFunctionsChange = useCallback(async (selectedIds: string[]) => {
        const functions = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
        setForm(prevForm => ({ ...prevForm, agent_tools: functions }));
    }, [fetchItem]);

    const handleRetrievalFunctionsChange = useCallback(async (selectedIds: string[]) => {
        const functions = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
        setForm(prevForm => ({ ...prevForm, retrieval_tools: functions }));
    }, [fetchItem]);

    const handleToolCallCheckpointChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const checkpoint = await fetchItem('usercheckpoints', selectedIds[0]) as UserCheckpoint;
            setForm(prevForm => {
                // Initialize default checkpoints if they don't exist
                const currentCheckpoints = prevForm.default_user_checkpoints ?? {
                    [CheckpointType.TOOL_CALL]: checkpoint,
                    [CheckpointType.CODE_EXECUTION]: {
                        user_prompt: '',
                        options_obj: {},
                        task_next_obj: {},
                        request_feedback: false
                    }
                };

                return {
                    ...prevForm,
                    default_user_checkpoints: {
                        ...currentCheckpoints,
                        [CheckpointType.TOOL_CALL]: checkpoint
                    }
                };
            });
        }
    }, [fetchItem]);

    const handleCodeExecCheckpointChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const checkpoint = await fetchItem('usercheckpoints', selectedIds[0]) as UserCheckpoint;
            setForm(prevForm => {
                // Initialize default checkpoints if they don't exist
                const currentCheckpoints = prevForm.default_user_checkpoints ?? {
                    [CheckpointType.TOOL_CALL]: {
                        user_prompt: '',
                        options_obj: {},
                        task_next_obj: {},
                        request_feedback: false
                    },
                    [CheckpointType.CODE_EXECUTION]: checkpoint
                };

                return {
                    ...prevForm,
                    default_user_checkpoints: {
                        ...currentCheckpoints,
                        [CheckpointType.CODE_EXECUTION]: checkpoint
                    }
                };
            });
        }
    }, [fetchItem]);

    const populateConfig = async () => {
        if (mode === 'create' && user?.default_chat_config && !item) {
            const config = user.default_chat_config;
            const [agent, agentTools, retrievalTools, toolCallCheckpoint, codeExecCheckpoint, dataCluster] = await Promise.all([
                config.alice_agent ? fetchItem('agents', config.alice_agent) : undefined,
                Promise.all((config.agent_tools || []).map(id => fetchItem('tasks', id))),
                Promise.all((config.retrieval_tools || []).map(id => fetchItem('tasks', id))),
                config.default_user_checkpoints[CheckpointType.TOOL_CALL] ?
                    fetchItem('usercheckpoints', config.default_user_checkpoints[CheckpointType.TOOL_CALL]) : undefined,
                config.default_user_checkpoints[CheckpointType.CODE_EXECUTION] ?
                    fetchItem('usercheckpoints', config.default_user_checkpoints[CheckpointType.CODE_EXECUTION]) : undefined,
                config.data_cluster ? fetchItem('dataclusters', config.data_cluster) : undefined
            ]);

            setForm(prevForm => ({
                ...prevForm,
                alice_agent: agent as AliceAgent,
                agent_tools: agentTools as AliceTask[],
                retrieval_tools: retrievalTools as AliceTask[],
                default_user_checkpoints: {
                    [CheckpointType.TOOL_CALL]: toolCallCheckpoint as UserCheckpoint,
                    [CheckpointType.CODE_EXECUTION]: codeExecCheckpoint as UserCheckpoint
                },
                data_cluster: dataCluster as DataCluster,
            }));
        } else if (item) {
            setForm(item);
        } else if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultChatForm());
        }
    };

    const memoizedAgentSelect = useMemo(() => (
        <EnhancedSelect<AliceAgent>
            componentType="agents"
            EnhancedView={AgentShortListView}
            selectedItems={form.alice_agent ? [form.alice_agent] : []}
            onSelect={handleAgentChange}
            isInteractable={isEditMode}
            label="Select Chat Agent"
            description='This agent will be used to respond to user messages in the chat. This models in this agent will be used to generate responses, transcribe files, etc'
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="agent"
            showCreateButton={true}
        />
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.alice_agent, handleAgentChange, isEditMode, activeAccordion, handleAccordionToggle]);

    const memoizedTaskSelect = useMemo(() => (
        <EnhancedSelect<AliceTask>
            componentType="tasks"
            EnhancedView={TaskShortListView}
            selectedItems={form.agent_tools || []}
            onSelect={handleFunctionsChange}
            isInteractable={isEditMode}
            multiple
            label="Select Agent Tools"
            description='These tools will be given to the agent. '
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="agent_tools"
            showCreateButton={true}
        />
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.agent_tools, handleFunctionsChange, isEditMode, activeAccordion, handleAccordionToggle]);

    const memoizedRetrievalTaskSelect = useMemo(() => (
        <EnhancedSelect<AliceTask>
            componentType="tasks"
            EnhancedView={TaskShortListView}
            selectedItems={form.retrieval_tools || []}
            onSelect={handleRetrievalFunctionsChange}
            isInteractable={isEditMode}
            multiple
            label="Select Retrieval Tools"
            description='These tools will be given to the agent, and provided access to the data cluster in the chat.'
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="retrieval_tools"
            showCreateButton={true}
        />
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.agent_tools, handleRetrievalFunctionsChange, isEditMode, activeAccordion, handleAccordionToggle]);

    const memoizedToolCallCheckpointSelect = useMemo(() => (
        <EnhancedSelect<UserCheckpoint>
            componentType="usercheckpoints"
            EnhancedView={UserCheckpointShortListView}
            selectedItems={form.default_user_checkpoints?.[CheckpointType.TOOL_CALL] ? [form.default_user_checkpoints[CheckpointType.TOOL_CALL]] : []}
            onSelect={handleToolCallCheckpointChange}
            isInteractable={isEditMode}
            label="Select Tool Call Checkpoint"
            description='This checkpoint will be used when the agent calls a tool if their permission level is 2.'
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="tool_call_checkpoint"
            showCreateButton={true}
        />
    ), [form.default_user_checkpoints, handleToolCallCheckpointChange, isEditMode, activeAccordion, handleAccordionToggle]);

    const memoizedCodeExecCheckpointSelect = useMemo(() => (
        <EnhancedSelect<UserCheckpoint>
            componentType="usercheckpoints"
            EnhancedView={UserCheckpointShortListView}
            selectedItems={form.default_user_checkpoints?.[CheckpointType.CODE_EXECUTION] ? [form.default_user_checkpoints[CheckpointType.CODE_EXECUTION]] : []}
            onSelect={handleCodeExecCheckpointChange}
            isInteractable={isEditMode}
            label="Select Code Execution Checkpoint"
            description='This checkpoint will be used when the agent executes code and their permission level = 2.'
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="code_exec_checkpoint"
            showCreateButton={true}
        />
    ), [form.default_user_checkpoints, handleCodeExecCheckpointChange, isEditMode, activeAccordion, handleAccordionToggle]);

    return (
        <GenericFlexibleView
            elementType='Chat'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={form as AliceChat}
            itemType='chats'
        >
            {validationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {validationError}
                </Alert>
            )}

            <TextInput
                name="name"
                label="Chat Name"
                value={form.name}
                onChange={(value) => handleFieldChange('name', value)}
                disabled={!isEditMode}
                required
                description="The display name of the chat."
                fullWidth
            />
            {memoizedAgentSelect}
            {memoizedTaskSelect}
            {memoizedRetrievalTaskSelect}
            {form.messages && form.messages.length > 0 && (
                <>
                    <Box mt={2}>
                        <MessageListView
                            items={form.messages || []}
                            item={null}
                            onChange={() => { }}
                            mode={'view'}
                            handleSave={async () => { }}
                            onView={(message) => selectCardItem && selectCardItem('Message', message._id ?? '', message)}
                        />
                    </Box>
                </>
            )}
            {memoizedToolCallCheckpointSelect}
            {memoizedCodeExecCheckpointSelect}
            <DataClusterManager
                dataCluster={form.data_cluster}
                isEditable={true}
                onDataClusterChange={(dataCluster) => setForm(prevForm => ({ ...prevForm, data_cluster: dataCluster }))}
                flatten={false}
            />

        </GenericFlexibleView>
    );
};

export default ChatFlexibleView;