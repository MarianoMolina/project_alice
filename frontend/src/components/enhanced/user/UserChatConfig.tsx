import React, { useCallback, useEffect, useState } from 'react';
import { Box, Chip, Grid, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { User, UserDefaultChatConfig } from '../../../types/UserTypes';
import { AliceAgent } from '../../../types/AgentTypes';
import { PopulatedTask } from '../../../types/TaskTypes';
import { UserCheckpoint } from '../../../types/UserCheckpointTypes';
import { CheckpointType } from '../../../types/ChatTypes';
import { PopulatedDataCluster } from '../../../types/DataClusterTypes';
import { useApi } from '../../../contexts/ApiContext';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import AgentShortListView from '../../enhanced/agent/agent/AgentShortListView';
import TaskShortListView from '../../enhanced/task/task/TaskShortListView';
import UserCheckpointShortListView from '../../enhanced/user_checkpoint/user_checkpoint/UserCheckpointShortListView';
import DataClusterManager from '../../enhanced/data_cluster/data_cluster_manager/DataClusterManager';
import { AIAgentIcon } from '../../../utils/CustomIcons';
import { Build, Search, Security } from '@mui/icons-material';
import { formatStringWithSpaces } from '../../../utils/StyleUtils';
import { useDialog } from '../../../contexts/DialogContext';

interface ChatConfigProps {
    editedUser: User;
    isEditing: boolean;
    onUserEdit: (updatedUser: User) => void;
}

interface PopulatedItems {
    agent?: AliceAgent;
    agentTools: PopulatedTask[];
    retrievalTools: PopulatedTask[];
    toolCallCheckpoint?: UserCheckpoint;
    codeExecCheckpoint?: UserCheckpoint;
    dataCluster?: PopulatedDataCluster;
}

export const ChatConfig: React.FC<ChatConfigProps> = ({
    editedUser,
    isEditing,
    onUserEdit
}) => {
    const { fetchItem, fetchPopulatedItem } = useApi();
    const { selectCardItem } = useDialog();
    const [populatedItems, setPopulatedItems] = useState<PopulatedItems>({
        agentTools: [],
        retrievalTools: []
    });

    useEffect(() => {
        const populateItems = async () => {
            const [
                agent,
                agentTools,
                retrievalTools,
                toolCallCheckpoint,
                codeExecCheckpoint,
                dataCluster
            ] = await Promise.all([
                editedUser.default_chat_config?.alice_agent ?
                    fetchPopulatedItem('agents', editedUser.default_chat_config.alice_agent) : undefined,
                Promise.all((editedUser.default_chat_config?.agent_tools || [])
                    .map(id => fetchPopulatedItem('tasks', id))),
                Promise.all((editedUser.default_chat_config?.retrieval_tools || [])
                    .map(id => fetchPopulatedItem('tasks', id))),
                editedUser.default_chat_config?.default_user_checkpoints?.[CheckpointType.TOOL_CALL] ?
                    fetchPopulatedItem('usercheckpoints', editedUser.default_chat_config.default_user_checkpoints[CheckpointType.TOOL_CALL]) : undefined,
                editedUser.default_chat_config?.default_user_checkpoints?.[CheckpointType.CODE_EXECUTION] ?
                    fetchPopulatedItem('usercheckpoints', editedUser.default_chat_config.default_user_checkpoints[CheckpointType.CODE_EXECUTION]) : undefined,
                editedUser.default_chat_config?.data_cluster ?
                    typeof editedUser.default_chat_config.data_cluster === 'string' ?
                        fetchPopulatedItem('dataclusters', editedUser.default_chat_config.data_cluster) : undefined
                    : undefined]);
            setPopulatedItems({
                agent: agent as AliceAgent,
                agentTools: agentTools as PopulatedTask[],
                retrievalTools: retrievalTools as PopulatedTask[],
                toolCallCheckpoint: toolCallCheckpoint as UserCheckpoint,
                codeExecCheckpoint: codeExecCheckpoint as UserCheckpoint,
                dataCluster: dataCluster as PopulatedDataCluster
            });
        };

        populateItems();
    }, [editedUser.default_chat_config, fetchItem, fetchPopulatedItem]);

    const handleAgentChange = useCallback(async (selectedIds: AliceAgent[]) => {
        if (selectedIds.length > 0) {
            onUserEdit({
                ...editedUser,
                default_chat_config: {
                    ...editedUser.default_chat_config,
                    alice_agent: selectedIds[0]._id,
                } as UserDefaultChatConfig
            });
        }
    }, [editedUser, onUserEdit]);

    const handleAgentToolsChange = useCallback((selectedIds: PopulatedTask[]) => {
        onUserEdit({
            ...editedUser,
            default_chat_config: {
                ...editedUser.default_chat_config,
                agent_tools: selectedIds.map(task => task._id),
            } as UserDefaultChatConfig
        });
    }, [editedUser, onUserEdit]);

    const handleRetrievalToolsChange = useCallback((selectedIds: PopulatedTask[]) => {
        onUserEdit({
            ...editedUser,
            default_chat_config: {
                ...editedUser.default_chat_config,
                retrieval_tools: selectedIds.map(task => task._id),
            } as UserDefaultChatConfig
        });
    }, [editedUser, onUserEdit]);

    const handleToolCallCheckpointChange = useCallback(async (selectedIds: UserCheckpoint[]) => {
        if (selectedIds.length > 0) {
            const currentCheckpoints = editedUser.default_chat_config?.default_user_checkpoints ?? {};
            onUserEdit({
                ...editedUser,
                default_chat_config: {
                    ...editedUser.default_chat_config,
                    default_user_checkpoints: {
                        ...currentCheckpoints,
                        [CheckpointType.TOOL_CALL]: selectedIds[0]._id,
                    },
                } as UserDefaultChatConfig
            });
        }
    }, [editedUser, onUserEdit]);

    const handleCodeExecCheckpointChange = useCallback(async (selectedIds: UserCheckpoint[]) => {
        if (selectedIds.length > 0) {
            const currentCheckpoints = editedUser.default_chat_config?.default_user_checkpoints ?? {};
            onUserEdit({
                ...editedUser,
                default_chat_config: {
                    ...editedUser.default_chat_config,
                    default_user_checkpoints: {
                        ...currentCheckpoints,
                        [CheckpointType.CODE_EXECUTION]: selectedIds[0]._id,
                    },
                } as UserDefaultChatConfig
            });
        }
    }, [editedUser, onUserEdit]);

    const handleDataClusterChange = useCallback((dataCluster: PopulatedDataCluster | undefined) => {
        onUserEdit({
            ...editedUser,
            default_chat_config: {
                ...editedUser.default_chat_config,
                data_cluster: dataCluster,
            } as UserDefaultChatConfig
        });
    }, [editedUser, onUserEdit]);

    if (isEditing) {
        return (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <EnhancedSelect<AliceAgent>
                        componentType="agents"
                        EnhancedView={AgentShortListView}
                        selectedItems={populatedItems?.agent ? [populatedItems.agent] : []}
                        onSelect={handleAgentChange}
                        label="Select Default Agent"
                        description='The agent that will be used for chat sessions.'
                        showCreateButton={true}
                        isInteractable={isEditing}
                    />
                </Grid>
                <Grid item xs={12}>
                    <EnhancedSelect<PopulatedTask>
                        componentType="tasks"
                        EnhancedView={TaskShortListView}
                        selectedItems={populatedItems.agentTools}
                        onSelect={handleAgentToolsChange}
                        multiple
                        label="Select Default Agent Tools"
                        description='The tools that the chat agent will have access to.'
                        showCreateButton={true}
                        isInteractable={isEditing}
                    />
                </Grid>
                <Grid item xs={12}>
                    <EnhancedSelect<PopulatedTask>
                        componentType="tasks"
                        EnhancedView={TaskShortListView}
                        selectedItems={populatedItems.retrievalTools}
                        onSelect={handleRetrievalToolsChange}
                        multiple
                        label="Select Default Retrieval Tools"
                        description='The tools that the chat agent will use to retrieve information from the data cluster.'
                        showCreateButton={true}
                        isInteractable={isEditing}
                    />
                </Grid>
                <Grid item xs={12}>
                    <EnhancedSelect<UserCheckpoint>
                        componentType="usercheckpoints"
                        EnhancedView={UserCheckpointShortListView}
                        selectedItems={populatedItems?.toolCallCheckpoint ? [populatedItems.toolCallCheckpoint] : []}
                        onSelect={handleToolCallCheckpointChange}
                        label="Select Default Tool Call Checkpoint"
                        description='The checkpoint that will be used when a tool is called if the agent needs to ask for permission.'
                        showCreateButton={true}
                        isInteractable={isEditing}
                    />
                </Grid>
                <Grid item xs={12}>
                    <EnhancedSelect<UserCheckpoint>
                        componentType="usercheckpoints"
                        EnhancedView={UserCheckpointShortListView}
                        selectedItems={populatedItems.codeExecCheckpoint ? [populatedItems.codeExecCheckpoint] : []}
                        onSelect={handleCodeExecCheckpointChange}
                        label="Select Code Execution Checkpoint"
                        showCreateButton={true}
                        isInteractable={true}
                    />
                </Grid>
                <Grid item xs={12}>
                    <DataClusterManager
                        dataCluster={populatedItems.dataCluster}
                        isEditable={isEditing}
                        onDataClusterChange={handleDataClusterChange}
                        flatten={false}
                    />
                </Grid>
            </Grid>
        );
    }
    return (
        <List>
            {/* Default Agent */}
            <ListItemButton
                onClick={() => populatedItems.agent?._id &&
                    selectCardItem('Agent', populatedItems.agent._id, populatedItems.agent)}
                disabled={!populatedItems.agent}
            >
                <ListItemIcon>
                    <AIAgentIcon />
                </ListItemIcon>
                <ListItemText
                    primary="Default Agent"
                    secondary={populatedItems.agent?.name || 'No agent selected'}
                />
            </ListItemButton>

            {/* Agent Tools */}
            <Box>
                <Typography variant="subtitle2" sx={{ px: 2, pt: 1 }}>
                    Agent Tools
                </Typography>
                {populatedItems.agentTools.length > 0 ? (
                    populatedItems.agentTools.map((tool) => (
                        <ListItemButton
                            key={tool._id}
                            onClick={() => tool._id && selectCardItem('Task', tool._id, tool)}
                            sx={{ pl: 4 }}
                        >
                            <ListItemIcon>
                                <Build />
                            </ListItemIcon>
                            <ListItemText primary={formatStringWithSpaces(tool.task_name)} />
                        </ListItemButton>
                    ))
                ) : (
                    <Typography variant="body2" sx={{ px: 4, py: 1 }} color="textSecondary">
                        No agent tools configured
                    </Typography>
                )}
            </Box>

            {/* Retrieval Tools */}
            <Box>
                <Typography variant="subtitle2" sx={{ px: 2, pt: 1 }}>
                    Retrieval Tools
                </Typography>
                {populatedItems.retrievalTools.length > 0 ? (
                    populatedItems.retrievalTools.map((tool) => (
                        <ListItemButton
                            key={tool._id}
                            onClick={() => tool._id && selectCardItem('Task', tool._id, tool)}
                            sx={{ pl: 4 }}
                        >
                            <ListItemIcon>
                                <Search />
                            </ListItemIcon>
                            <ListItemText primary={formatStringWithSpaces(tool.task_name)} />
                        </ListItemButton>
                    ))
                ) : (
                    <Typography variant="body2" sx={{ px: 4, py: 1 }} color="textSecondary">
                        No retrieval tools configured
                    </Typography>
                )}
            </Box>

            {/* Checkpoints */}
            <Box>
                <Typography variant="subtitle2" sx={{ px: 2, pt: 1 }}>
                    Security Checkpoints
                </Typography>
                <Box sx={{ px: 4, py: 1 }}>
                    {populatedItems.toolCallCheckpoint && (
                        <Chip
                            icon={<Security />}
                            label={`Tool Call: ${populatedItems.toolCallCheckpoint.user_prompt}`}
                            onClick={() => populatedItems.toolCallCheckpoint?._id &&
                                selectCardItem('UserCheckpoint', populatedItems.toolCallCheckpoint._id, populatedItems.toolCallCheckpoint)}
                            sx={{ m: 0.5 }}
                        />
                    )}
                    {populatedItems.codeExecCheckpoint && (
                        <Chip
                            icon={<Security />}
                            label={`Code Execution: ${populatedItems.codeExecCheckpoint.user_prompt}`}
                            onClick={() => populatedItems.codeExecCheckpoint?._id &&
                                selectCardItem('UserCheckpoint', populatedItems.codeExecCheckpoint._id, populatedItems.codeExecCheckpoint)}
                            sx={{ m: 0.5 }}
                        />
                    )}
                    {!populatedItems.toolCallCheckpoint && !populatedItems.codeExecCheckpoint && (
                        <Typography variant="body2" color="textSecondary">
                            No checkpoints configured
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Data Cluster */}
            <Box>
                <Typography variant="subtitle2" sx={{ px: 2, pt: 1 }}>
                    Data Cluster
                </Typography>
                <Box sx={{ px: 4, py: 1 }}>
                    {populatedItems.dataCluster ? (
                        <DataClusterManager
                            dataCluster={populatedItems.dataCluster}
                            isEditable={false}
                            flatten={false}
                        />
                    ) : (
                        <Typography variant="body2" color="textSecondary">
                            No data cluster configured
                        </Typography>
                    )}
                </Box>
            </Box>
        </List>
    );
};

export default ChatConfig;