import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import { Person } from '@mui/icons-material';
import { useApi } from '../../../contexts/ApiContext';
import { User, UserDefaultChatConfig } from '../../../types/UserTypes';
import { AliceAgent } from '../../../types/AgentTypes';
import { AliceTask } from '../../../types/TaskTypes';
import { UserCheckpoint } from '../../../types/UserCheckpointTypes';
import { CheckpointType } from '../../../types/ChatTypes';
import useStyles from '../../../styles/UserSettingsStyles';
import Logger from '../../../utils/Logger';
import { Dispatch, SetStateAction } from 'react';
import EnhancedSelect from '../../enhanced/common/enhanced_select/EnhancedSelect';
import AgentShortListView from '../../enhanced/agent/agent/AgentShortListView';
import TaskShortListView from '../../enhanced/task/task/TaskShortListView';
import UserCheckpointShortListView from '../../enhanced/user_checkpoint/user_checkpoint/UserCheckpointShortListView';
import DataClusterManager from '../../enhanced/data_cluster/data_cluster_manager/DataClusterManager';
import { DataCluster } from '../../../types/DataClusterTypes';
import { useAuth } from '../../../contexts/AuthContext';
import { TextInput } from '../../enhanced/common/inputs/TextInput';
import TitleBox from '../../enhanced/common/inputs/TitleBox';

interface PersonalInformationProps {
    userObject: User;
    setUserObject: Dispatch<SetStateAction<User | null>>;
}

const PersonalInformation: React.FC<PersonalInformationProps> = ({
    userObject,
    setUserObject,
}) => {
    const classes = useStyles();
    const { fetchItem } = useApi();
    const { updateUser } = useAuth();
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [populatedItems, setPopulatedItems] = useState<{
        agent?: AliceAgent,
        agentTools: AliceTask[],
        retrievalTools: AliceTask[],
        toolCallCheckpoint?: UserCheckpoint,
        codeExecCheckpoint?: UserCheckpoint,
        dataCluster?: DataCluster
    }>({
        agentTools: [],
        retrievalTools: []
    });

    useEffect(() => {
        const populateItems = async () => {
            Logger.debug(`Populating items for user ${JSON.stringify(userObject, null, 2)}`);
            const [
                agent,
                agentTools,
                retrievalTools,
                toolCallCheckpoint,
                codeExecCheckpoint,
                dataCluster
            ] = await Promise.all([
                userObject.default_chat_config?.alice_agent ?
                    fetchItem('agents', userObject.default_chat_config.alice_agent) : undefined,
                Promise.all((userObject.default_chat_config?.agent_tools || [])
                    .map(id => fetchItem('tasks', id))),
                Promise.all((userObject.default_chat_config?.retrieval_tools || [])
                    .map(id => fetchItem('tasks', id))),
                userObject.default_chat_config?.default_user_checkpoints?.[CheckpointType.TOOL_CALL] ?
                    fetchItem('usercheckpoints', userObject.default_chat_config.default_user_checkpoints[CheckpointType.TOOL_CALL]) : undefined,
                userObject.default_chat_config?.default_user_checkpoints?.[CheckpointType.CODE_EXECUTION] ?
                    fetchItem('usercheckpoints', userObject.default_chat_config.default_user_checkpoints[CheckpointType.CODE_EXECUTION]) : undefined,
                userObject.default_chat_config?.data_cluster ?
                    (typeof userObject.default_chat_config.data_cluster === 'string' ?
                        fetchItem('dataclusters', userObject.default_chat_config.data_cluster) : undefined)
                    : undefined]);

            setPopulatedItems({
                agent: agent as AliceAgent,
                agentTools: agentTools as AliceTask[],
                retrievalTools: retrievalTools as AliceTask[],
                toolCallCheckpoint: toolCallCheckpoint as UserCheckpoint,
                codeExecCheckpoint: codeExecCheckpoint as UserCheckpoint,
                dataCluster: dataCluster as DataCluster
            });
        };
        Logger.debug(`Populating items for user ${JSON.stringify(userObject, null, 2)}`);
        populateItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userObject.default_chat_config, fetchItem]);

    const handleAgentChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const agent = await fetchItem('agents', selectedIds[0]) as AliceAgent;
            setUserObject(prevUser => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    default_chat_config: {
                        ...prevUser.default_chat_config,
                        alice_agent: agent._id,
                    } as UserDefaultChatConfig,
                };
            });
        }
    }, [fetchItem, setUserObject]);

    const handleAgentToolsChange = useCallback(async (selectedIds: string[]) => {
        setUserObject(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                default_chat_config: {
                    ...prevUser.default_chat_config,
                    agent_tools: selectedIds,
                } as UserDefaultChatConfig,
            };
        });
    }, [setUserObject]);

    const handleRetrievalToolsChange = useCallback(async (selectedIds: string[]) => {
        setUserObject(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                default_chat_config: {
                    ...prevUser.default_chat_config,
                    retrieval_tools: selectedIds,
                } as UserDefaultChatConfig,
            };
        });
    }, [setUserObject]);

    const handleToolCallCheckpointChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const checkpoint = await fetchItem('usercheckpoints', selectedIds[0]) as UserCheckpoint;
            setUserObject(prevUser => {
                if (!prevUser) return null;
                const currentCheckpoints = prevUser.default_chat_config?.default_user_checkpoints ?? {};
                return {
                    ...prevUser,
                    default_chat_config: {
                        ...prevUser.default_chat_config,
                        default_user_checkpoints: {
                            ...currentCheckpoints,
                            [CheckpointType.TOOL_CALL]: checkpoint._id,
                        },
                    } as UserDefaultChatConfig,
                };
            });
        }
    }, [fetchItem, setUserObject]);

    const handleCodeExecCheckpointChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const checkpoint = await fetchItem('usercheckpoints', selectedIds[0]) as UserCheckpoint;
            setUserObject(prevUser => {
                if (!prevUser) return null;
                const currentCheckpoints = prevUser.default_chat_config?.default_user_checkpoints ?? {};
                return {
                    ...prevUser,
                    default_chat_config: {
                        ...prevUser.default_chat_config,
                        default_user_checkpoints: {
                            ...currentCheckpoints,
                            [CheckpointType.CODE_EXECUTION]: checkpoint._id,
                        },
                    } as UserDefaultChatConfig,
                };
            });
        }
    }, [fetchItem, setUserObject]);

    const handleDataClusterChange = useCallback((dataCluster: DataCluster | undefined) => {
        setUserObject(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                default_chat_config: {
                    ...prevUser.default_chat_config,
                    data_cluster: dataCluster,
                } as UserDefaultChatConfig,
            };
        });
    }, [setUserObject]);

    const validateCheckpoints = useCallback(() => {
        const checkpoints = userObject.default_chat_config?.default_user_checkpoints;
        if (!checkpoints) {
            setValidationError('Both Tool Call and Code Execution checkpoints are required');
            return false;
        }

        const hasToolCall = !!checkpoints[CheckpointType.TOOL_CALL];
        const hasCodeExec = !!checkpoints[CheckpointType.CODE_EXECUTION];

        if (!hasToolCall || !hasCodeExec) {
            setValidationError('Both Tool Call and Code Execution checkpoints are required');
            return false;
        }

        setValidationError(null);
        return true;
    }, [userObject.default_chat_config?.default_user_checkpoints]);

    const handleSaveChanges = useCallback(async () => {
        if (!validateCheckpoints()) return;
        if (isSaving) return;

        try {
            setIsSaving(true);
            Logger.info('Saving user changes');
            await updateUser(userObject);
        } catch (error) {
            Logger.error('Error updating user:', error);
            setValidationError('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }, [userObject, updateUser, validateCheckpoints, isSaving]);

    const handleAccordionToggle = useCallback((accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    }, []);

    return (
        <Card className={classes.card}>
            <CardContent>
                <Box className={classes.userInfoHeader}>
                    <Person />
                    <Typography variant="h5">Personal Information</Typography>
                </Box>

                {validationError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {validationError}
                    </Alert>
                )}
                <TextInput
                    name='name'
                    label='Name'
                    value={userObject.name || ''}
                    onChange={(value = '') => setUserObject(prevUser => prevUser ? { ...prevUser, name: value } : null)}
                    disabled={false}
                    description='Enter your name'
                />
                <TextInput
                    name='email'
                    label='Email'
                    value={userObject.email || ''}
                    onChange={(value = '') => setUserObject(prevUser => prevUser ? { ...prevUser, email: value } : null)}
                    disabled={false}
                    description='Enter your email'
                />
                <TitleBox title="Default Chat Configuration" >
                    <EnhancedSelect<AliceAgent>
                        componentType="agents"
                        EnhancedView={AgentShortListView}
                        selectedItems={populatedItems?.agent ? [populatedItems.agent] : []}
                        onSelect={handleAgentChange}
                        label="Select Default Agent"
                        activeAccordion={activeAccordion}
                        description='The agent that will be used for chat sessions.'
                        onAccordionToggle={handleAccordionToggle}
                        accordionEntityName="agent"
                        showCreateButton={true}
                        isInteractable={true}
                    />
                    <EnhancedSelect<AliceTask>
                        componentType="tasks"
                        EnhancedView={TaskShortListView}
                        selectedItems={populatedItems.agentTools}
                        onSelect={handleAgentToolsChange}
                        multiple
                        label="Select Default Agent Tools"
                        activeAccordion={activeAccordion}
                        description='The tools that the chat agent will have access to.'
                        onAccordionToggle={handleAccordionToggle}
                        accordionEntityName="agent_tools"
                        showCreateButton={true}
                        isInteractable={true}
                    />
                    <EnhancedSelect<AliceTask>
                        componentType="tasks"
                        EnhancedView={TaskShortListView}
                        selectedItems={populatedItems.retrievalTools}
                        onSelect={handleRetrievalToolsChange}
                        multiple
                        label="Select Default Retrieval Tools"
                        description='The tools that the chat agent will use to retrieve information from the data cluster.'
                        activeAccordion={activeAccordion}
                        onAccordionToggle={handleAccordionToggle}
                        accordionEntityName="retrieval_tools"
                        showCreateButton={true}
                        isInteractable={true}
                    />
                    <EnhancedSelect<UserCheckpoint>
                        componentType="usercheckpoints"
                        EnhancedView={UserCheckpointShortListView}
                        selectedItems={populatedItems?.toolCallCheckpoint ?
                            [populatedItems.toolCallCheckpoint] : []}
                        onSelect={handleToolCallCheckpointChange}
                        label="Select Default Tool Call Checkpoint"
                        description='The checkpoint that will be used when a tool is called if the agent needs to ask for permission.'
                        activeAccordion={activeAccordion}
                        onAccordionToggle={handleAccordionToggle}
                        accordionEntityName="tool_call_checkpoint"
                        showCreateButton={true}
                        isInteractable={true}
                    />
                    <EnhancedSelect<UserCheckpoint>
                        componentType="usercheckpoints"
                        EnhancedView={UserCheckpointShortListView}
                        selectedItems={populatedItems.codeExecCheckpoint ?
                            [populatedItems.codeExecCheckpoint] : []}
                        onSelect={handleCodeExecCheckpointChange}
                        label="Select Code Execution Checkpoint"
                        activeAccordion={activeAccordion}
                        onAccordionToggle={handleAccordionToggle}
                        accordionEntityName="code_exec_checkpoint"
                        showCreateButton={true}
                        isInteractable={true}
                    />
                    <DataClusterManager
                        dataCluster={populatedItems.dataCluster}
                        isEditable={true}
                        onDataClusterChange={handleDataClusterChange}
                        flatten={false}
                    />
                </TitleBox>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveChanges}
                    className={classes.saveButton}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default PersonalInformation;