import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Alert,
} from '@mui/material';
import { ChatComponentProps, getDefaultChatForm, CheckpointType, PopulatedAliceChat, AliceChat } from '../../../../types/ChatTypes';
import { PopulatedDataCluster } from '../../../../types/DataClusterTypes';
import { AliceAgent } from '../../../../types/AgentTypes';
import { PopulatedTask } from '../../../../types/TaskTypes';
import { UserCheckpoint } from '../../../../types/UserCheckpointTypes';
import EnhancedSelect from '../../../common/enhanced_select/EnhancedSelect';
import AgentShortListView from '../../agent/agent/AgentShortListView';
import TaskShortListView from '../../task/task/TaskShortListView';
import GenericFlexibleView from '../../../common/enhanced_component/FlexibleView';
import DataClusterManager from '../../data_cluster/data_cluster_manager/DataClusterManager';
import UserCheckpointShortListView from '../../user_checkpoint/user_checkpoint/UserCheckpointShortListView';
import TitleBox from '../../../common/inputs/TitleBox';
import { TextInput } from '../../../common/inputs/TextInput';
import { useAuth } from '../../../../contexts/AuthContext';
import Logger from '../../../../utils/Logger';
import { useApi } from '../../../../contexts/ApiContext';
import ApiValidationManager from '../../api/ApiValidationManager';
import { PopulatedChatThread } from '../../../../types/ChatThreadTypes';
import ManageReferenceList from '../../../common/referecence_list_manager/ManageReferenceList';

const ChatFlexibleView: React.FC<ChatComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { user } = useAuth();
    const { fetchPopulatedItem } = useApi();
    const [form, setForm] = useState<Partial<PopulatedAliceChat>>(item as PopulatedAliceChat || getDefaultChatForm());
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Chat' : mode === 'edit' ? 'Edit Chat' : 'Chat Details';
    const saveButtonText = form._id ? 'Update Chat' : 'Create Chat';

    Logger.debug('ChatFlexibleView', { item, mode });

    useEffect(() => {

        const populateConfig = async () => {
            if (mode === 'create' && user?.default_chat_config && !item) {
                const config = user.default_chat_config;
                const [agent, agentTools, retrievalTools, toolCallCheckpoint, codeExecCheckpoint, dataCluster] = await Promise.all([
                    config.alice_agent ? fetchPopulatedItem('agents', config.alice_agent) : undefined,
                    Promise.all((config.agent_tools || []).map(id => fetchPopulatedItem('tasks', id))),
                    Promise.all((config.retrieval_tools || []).map(id => fetchPopulatedItem('tasks', id))),
                    config.default_user_checkpoints[CheckpointType.TOOL_CALL] ?
                        fetchPopulatedItem('usercheckpoints', config.default_user_checkpoints[CheckpointType.TOOL_CALL]) : undefined,
                    config.default_user_checkpoints[CheckpointType.CODE_EXECUTION] ?
                        fetchPopulatedItem('usercheckpoints', config.default_user_checkpoints[CheckpointType.CODE_EXECUTION]) : undefined,
                    config.data_cluster ? fetchPopulatedItem('dataclusters', config.data_cluster) : undefined
                ]);

                setForm(prevForm => ({
                    ...prevForm,
                    alice_agent: agent as AliceAgent,
                    agent_tools: agentTools as PopulatedTask[],
                    retrieval_tools: retrievalTools as PopulatedTask[],
                    default_user_checkpoints: {
                        [CheckpointType.TOOL_CALL]: toolCallCheckpoint as UserCheckpoint,
                        [CheckpointType.CODE_EXECUTION]: codeExecCheckpoint as UserCheckpoint
                    },
                    data_cluster: dataCluster as PopulatedDataCluster,
                }));
            } else if (item) {
                setForm(item as PopulatedAliceChat);
            } else if (!item || Object.keys(item).length === 0) {
                onChange(getDefaultChatForm());
            }
        };
        populateConfig();
    }, [item, onChange, user, mode, fetchPopulatedItem]);

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    const handleFieldChange = useCallback((field: keyof AliceChat, value: any) => {
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

    const handleAgentChange = useCallback(async (selectedIds: AliceAgent[]) => {
        if (selectedIds.length > 0) {
            setForm(prevForm => ({ ...prevForm, alice_agent: selectedIds[0] }));
        } else {
            setForm(prevForm => ({ ...prevForm, alice_agent: undefined }));
        }
    }, []);

    const handleFunctionsChange = useCallback(async (selectedIds: PopulatedTask[]) => {
        setForm(prevForm => ({ ...prevForm, agent_tools: selectedIds }));
    }, []);

    const handleRetrievalFunctionsChange = useCallback(async (selectedIds: PopulatedTask[]) => {
        setForm(prevForm => ({ ...prevForm, retrieval_tools: selectedIds }));
    }, []);

    const handleToolCallCheckpointChange = useCallback(async (selectedIds: UserCheckpoint[]) => {
        if (selectedIds.length > 0) {
            setForm(prevForm => {
                // Initialize default checkpoints if they don't exist
                const currentCheckpoints = prevForm.default_user_checkpoints ?? {
                    [CheckpointType.TOOL_CALL]: selectedIds[0],
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
                        [CheckpointType.TOOL_CALL]: selectedIds[0]
                    }
                };
            });
        }
    }, []);

    const handleCodeExecCheckpointChange = useCallback(async (selectedIds: UserCheckpoint[]) => {
        if (selectedIds.length > 0) {
            setForm(prevForm => {
                // Initialize default checkpoints if they don't exist
                const currentCheckpoints = prevForm.default_user_checkpoints ?? {
                    [CheckpointType.TOOL_CALL]: {
                        user_prompt: '',
                        options_obj: {},
                        task_next_obj: {},
                        request_feedback: false
                    },
                    [CheckpointType.CODE_EXECUTION]: selectedIds[0]
                };

                return {
                    ...prevForm,
                    default_user_checkpoints: {
                        ...currentCheckpoints,
                        [CheckpointType.CODE_EXECUTION]: selectedIds[0]
                    }
                };
            });
        }
    }, []);

    const handleThreadChange = useCallback(async (threadIds: string[]) => {
        try {
            // Get the current threads from the form
            const currentThreads = form.threads || [];

            // Create a map of current thread IDs to their populated objects
            const currentThreadMap = new Map(
                currentThreads.map(thread => [thread._id, thread])
            );

            // Initialize array for new thread list
            const updatedThreads: PopulatedChatThread[] = [];

            // Process each thread ID
            for (const threadId of threadIds) {
                // If we already have the populated thread, use it
                if (currentThreadMap.has(threadId)) {
                    updatedThreads.push(currentThreadMap.get(threadId)!);
                } else {
                    // Fetch the new thread's populated data
                    try {
                        const populatedThread = await fetchPopulatedItem('chatthreads', threadId) as PopulatedChatThread;
                        if (populatedThread) {
                            updatedThreads.push(populatedThread);
                        }
                    } catch (error) {
                        Logger.error('Error fetching thread', { threadId, error });
                        // Continue with other threads even if one fails
                        continue;
                    }
                }
            }

            // Update the form with the new thread list
            setForm(prevForm => ({
                ...prevForm,
                threads: updatedThreads
            }));

        } catch (error) {
            Logger.error('Error in handleThreadChange', { error });
        }
    }, [form.threads, fetchPopulatedItem]);

    const memoizedAgentSelect = useMemo(() => (
        <EnhancedSelect<AliceAgent>
            componentType="agents"
            EnhancedView={AgentShortListView}
            selectedItems={form.alice_agent ? [form.alice_agent] : []}
            onSelect={handleAgentChange}
            isInteractable={isEditMode}
            label="Select Chat Agent"
            description='This agent will be used to respond to user messages in the chat. This models in this agent will be used to generate responses, transcribe files, etc'
            showCreateButton={true}
        />
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.alice_agent, handleAgentChange, isEditMode]);

    const memoizedTaskSelect = useMemo(() => (
        <EnhancedSelect<PopulatedTask>
            componentType="tasks"
            EnhancedView={TaskShortListView}
            selectedItems={form.agent_tools || []}
            onSelect={handleFunctionsChange}
            isInteractable={isEditMode}
            multiple
            label="Select Agent Tools"
            description='These tools will be given to the agent. '
            showCreateButton={true}
        />
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.agent_tools, handleFunctionsChange, isEditMode]);

    const memoizedRetrievalTaskSelect = useMemo(() => (
        <EnhancedSelect<PopulatedTask>
            componentType="tasks"
            EnhancedView={TaskShortListView}
            selectedItems={form.retrieval_tools || []}
            onSelect={handleRetrievalFunctionsChange}
            isInteractable={isEditMode}
            multiple
            label="Select Retrieval Tools"
            description='These tools will be given to the agent, and provided access to the data cluster in the chat.'
            showCreateButton={true}
        />
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.agent_tools, handleRetrievalFunctionsChange, isEditMode]);

    const memoizedToolCallCheckpointSelect = useMemo(() => (
        <EnhancedSelect<UserCheckpoint>
            componentType="usercheckpoints"
            EnhancedView={UserCheckpointShortListView}
            selectedItems={form.default_user_checkpoints?.[CheckpointType.TOOL_CALL] ? [form.default_user_checkpoints[CheckpointType.TOOL_CALL]] : []}
            onSelect={handleToolCallCheckpointChange}
            isInteractable={isEditMode}
            label="Select Tool Call Checkpoint"
            description='This checkpoint will be used when the agent calls a tool if their permission level is 2.'
            showCreateButton={true}
        />
    ), [form.default_user_checkpoints, handleToolCallCheckpointChange, isEditMode]);

    const memoizedCodeExecCheckpointSelect = useMemo(() => (
        <EnhancedSelect<UserCheckpoint>
            componentType="usercheckpoints"
            EnhancedView={UserCheckpointShortListView}
            selectedItems={form.default_user_checkpoints?.[CheckpointType.CODE_EXECUTION] ? [form.default_user_checkpoints[CheckpointType.CODE_EXECUTION]] : []}
            onSelect={handleCodeExecCheckpointChange}
            isInteractable={isEditMode}
            label="Select Code Execution Checkpoint"
            description='This checkpoint will be used when the agent executes code and their permission level = 2.'
            showCreateButton={true}
        />
    ), [form.default_user_checkpoints, handleCodeExecCheckpointChange, isEditMode]);

    const memoizedThreadSelect = useMemo(() => (

        <ManageReferenceList
            collectionType="chatthreads"
            elementIds={form.threads?.map(thread => thread._id!) || []}
            onListChange={handleThreadChange}
            isEditable={true}
        />
    ), [form.threads, handleThreadChange]);

    const memoizedDatacluster = useMemo(() => (
        <DataClusterManager
            dataCluster={form.data_cluster}
            isEditable={true}
            onDataClusterChange={(dataCluster) => setForm(prevForm => ({ ...prevForm, data_cluster: dataCluster }))}
            flatten={false}
        />
    ), [form.data_cluster]);

    return (
        <GenericFlexibleView
            elementType='Chat'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            mode={mode}
            item={form as PopulatedAliceChat}
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
            <TitleBox title="Agent Tools" >
                {memoizedTaskSelect}
                {memoizedRetrievalTaskSelect}
            </TitleBox>
            <TitleBox title="User Checkpoints" >
                {memoizedToolCallCheckpointSelect}
                {memoizedCodeExecCheckpointSelect}
            </TitleBox>
            {memoizedDatacluster}
            <TitleBox title="Threads" >
                {memoizedThreadSelect}
            </TitleBox>
            {form._id && (
                <TitleBox title="API validation" >
                    <ApiValidationManager chatId={form._id} />
                </TitleBox>
            )}
        </GenericFlexibleView>
    );
};

export default ChatFlexibleView;