// components/ui/user_settings/PersonalInformation.tsx
import React, { useCallback, useState } from 'react';
import { Box, TextField, Typography, Button, Card, CardContent, Alert } from '@mui/material';
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

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserObject(prevUser => prevUser ? { ...prevUser, [name]: value } : null);
    }, [setUserObject]);

    const handleAgentChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const agent = await fetchItem('agents', selectedIds[0]) as AliceAgent;
            setUserObject(prevUser => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    default_chat_config: {
                        ...prevUser.default_chat_config,
                        alice_agent: agent,
                    } as UserDefaultChatConfig,
                };
            });
        }
    }, [fetchItem, setUserObject]);

    const handleAgentToolsChange = useCallback(async (selectedIds: string[]) => {
        const tools = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
        setUserObject(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                default_chat_config: {
                    ...prevUser.default_chat_config,
                    agent_tools: tools,
                } as UserDefaultChatConfig,
            };
        });
    }, [fetchItem, setUserObject]);

    const handleRetrievalToolsChange = useCallback(async (selectedIds: string[]) => {
        const tools = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
        setUserObject(prevUser => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                default_chat_config: {
                    ...prevUser.default_chat_config,
                    retrieval_tools: tools,
                } as UserDefaultChatConfig,
            };
        });
    }, [fetchItem, setUserObject]);

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
                            [CheckpointType.TOOL_CALL]: checkpoint,
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
                            [CheckpointType.CODE_EXECUTION]: checkpoint,
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

                <TextField
                    label="Name"
                    name="name"
                    value={userObject.name || ''}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                />

                <TextField
                    label="Email"
                    name="email"
                    value={userObject.email || ''}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                />

                <Typography variant="h6" className={classes.titleText}>Default Chat Configuration</Typography>

                <Typography variant="subtitle1">Agent</Typography>
                <EnhancedSelect<AliceAgent>
                    componentType="agents"
                    EnhancedView={AgentShortListView}
                    selectedItems={userObject.default_chat_config?.alice_agent ? [userObject.default_chat_config.alice_agent] : []}
                    onSelect={handleAgentChange}
                    label="Select Default Agent"
                    activeAccordion={activeAccordion}
                    onAccordionToggle={handleAccordionToggle}
                    accordionEntityName="agent"
                    showCreateButton={true}
                    isInteractable={true}
                />

                <Typography variant="subtitle1">Agent Tools</Typography>
                <EnhancedSelect<AliceTask>
                    componentType="tasks"
                    EnhancedView={TaskShortListView}
                    selectedItems={userObject.default_chat_config?.agent_tools || []}
                    onSelect={handleAgentToolsChange}
                    multiple
                    label="Select Default Agent Tools"
                    activeAccordion={activeAccordion}
                    onAccordionToggle={handleAccordionToggle}
                    accordionEntityName="agent_tools"
                    showCreateButton={true}
                    isInteractable={true}
                />

                <Typography variant="subtitle1">Retrieval Tools</Typography>
                <EnhancedSelect<AliceTask>
                    componentType="tasks"
                    EnhancedView={TaskShortListView}
                    selectedItems={userObject.default_chat_config?.retrieval_tools || []}
                    onSelect={handleRetrievalToolsChange}
                    multiple
                    label="Select Default Retrieval Tools"
                    activeAccordion={activeAccordion}
                    onAccordionToggle={handleAccordionToggle}
                    accordionEntityName="retrieval_tools"
                    showCreateButton={true}
                    isInteractable={true}
                />

                <Typography variant="subtitle1">Default Checkpoints</Typography>
                <Box mb={2}>
                    <Typography variant="subtitle2" color="textSecondary">Tool Call Checkpoint</Typography>
                    <EnhancedSelect<UserCheckpoint>
                        componentType="usercheckpoints"
                        EnhancedView={UserCheckpointShortListView}
                        selectedItems={userObject.default_chat_config?.default_user_checkpoints?.[CheckpointType.TOOL_CALL] ?
                            [userObject.default_chat_config.default_user_checkpoints[CheckpointType.TOOL_CALL]] : []}
                        onSelect={handleToolCallCheckpointChange}
                        label="Select Tool Call Checkpoint"
                        activeAccordion={activeAccordion}
                        onAccordionToggle={handleAccordionToggle}
                        accordionEntityName="tool_call_checkpoint"
                        showCreateButton={true}
                        isInteractable={true}
                    />
                </Box>
                <Box mb={2}>
                    <Typography variant="subtitle2" color="textSecondary">Code Execution Checkpoint</Typography>
                    <EnhancedSelect<UserCheckpoint>
                        componentType="usercheckpoints"
                        EnhancedView={UserCheckpointShortListView}
                        selectedItems={userObject.default_chat_config?.default_user_checkpoints?.[CheckpointType.CODE_EXECUTION] ?
                            [userObject.default_chat_config.default_user_checkpoints[CheckpointType.CODE_EXECUTION]] : []}
                        onSelect={handleCodeExecCheckpointChange}
                        label="Select Code Execution Checkpoint"
                        activeAccordion={activeAccordion}
                        onAccordionToggle={handleAccordionToggle}
                        accordionEntityName="code_exec_checkpoint"
                        showCreateButton={true}
                        isInteractable={true}
                    />
                </Box>
                <Typography variant="subtitle1">Data Cluster</Typography>
                <DataClusterManager
                    dataCluster={userObject.default_chat_config?.data_cluster}
                    isEditable={true}
                    onDataClusterChange={handleDataClusterChange}
                    flatten={false}
                />
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