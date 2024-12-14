import React, { useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { Add, Person, Category, Settings, Description, Functions, Assignment, Api, AttachFile, Message, QuestionAnswer, Link, Feedback, LiveHelp, Diversity2 } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TASK_SIDEBAR_WIDTH_TABLE, TASK_SIDEBAR_WIDTH_COMPACT } from '../utils/Constants';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import { ComponentMode, CollectionElement, CollectionElementString, CollectionPopulatedElement, collectionNameToElementString, getCollectionNameFromElement } from '../types/CollectionTypes';
import EnhancedAgent from '../components/enhanced/agent/agent/EnhancedAgent';
import EnhancedPrompt from '../components/enhanced/prompt/prompt/EnhancedPrompt';
import EnhancedModel from '../components/enhanced/model/model/EnhancedModel';
import EnhancedParameter from '../components/enhanced/parameter/parameter/EnhancedParameter';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import EnchancedChat from '../components/enhanced/chat/chat/EnhancedChat';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';
import useStyles from '../styles/DatabaseStyles';
import PlaceholderSkeleton from '../components/ui/placeholder_skeleton/PlaceholderSkeleton';
import { useCardDialog } from '../contexts/CardDialogContext';
import EnhancedFile from '../components/enhanced/file/file/EnhancedFile';
import EnhancedMessage from '../components/enhanced/message/message/EnhancedMessage';
import Logger from '../utils/Logger';
import ToggleBox from '../components/ui/sidetab_header/ToggleBox';
import EnhancedUserCheckpoint from '../components/enhanced/user_checkpoint/user_checkpoint/EnhancedUserCheckpoint';
import EnhancedUserInteraction from '../components/enhanced/user_interaction/user_interaction/EnhancedUserInteraction';
import EnhancedEmbeddingChunk from '../components/enhanced/embedding_chunk/embedding_chunk/EnhancedEmbeddingChunk';
import EnhancedDataCluster from '../components/enhanced/data_cluster/data_cluster/EnhancedDataCluster';
import EnhancedEntityReference from '../components/enhanced/entity_reference/entity_reference/EnhancedEntityReference';
import EnhancedAPIConfig from '../components/enhanced/api_config/api_config/EnhancedAPIConfig';
import EnhancedCodeExecution from '../components/enhanced/code_execution/code_execution/EnhancedCodeExecution';
import EnhancedToolCall from '../components/enhanced/tool_calls/tool_calls/EnhancedToolCall';
import { fetchPopulatedItem } from '../services/api';

const Database: React.FC = () => {
    const classes = useStyles();
    const [selectedItem, setSelectedItem] = useState<CollectionPopulatedElement | null>(null);
    const { selectCardItem } = useCardDialog();
    const [activeTab, setActiveTab] = useState<CollectionElementString>('Agent');
    const [showActiveComponent, setShowActiveComponent] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'shortList' | 'table'>('list');
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

    const handleCreateNew = useCallback(() => {
        Logger.debug('Database - Create new clicked');
        setSelectedItem(null);
        setIsCreating(true);
        setShowActiveComponent(true);
    }, [setSelectedItem]);

    const handleItemSelect = useCallback(async (item: CollectionElement | CollectionPopulatedElement | null) => {
        Logger.debug('Database - Item selected:', item);
        // Use collectionNameToElementString to get the correct string
        const collectionName = getCollectionNameFromElement(activeTab);
        const popItem = await fetchPopulatedItem(collectionName, item?._id); 
        setSelectedItem(popItem as CollectionPopulatedElement);
        setIsCreating(false);
        setShowActiveComponent(true);
    }, [setSelectedItem, activeTab]);

    const handleSave = useCallback(async (item: CollectionElement | CollectionPopulatedElement | null) => {
        Logger.debug('Database - Saving item:', item);
        setSelectedItem(null);
        setIsCreating(false);
        setShowActiveComponent(false);
        setLastUpdate(Date.now());
    }, [setSelectedItem]);

    const handleDelete = useCallback(async (item: any) => {
        Logger.debug('Database - Deleting item:', item);
        setSelectedItem(null);
        setIsCreating(false);
        setShowActiveComponent(false);
        setLastUpdate(Date.now());
    }, [setSelectedItem]);

    const actions = [
        {
            name: `Create ${activeTab}`,
            icon: Add,
            action: handleCreateNew,
            disabled: activeTab === 'TaskResponse'
        }
    ];

    const tabs = [
        { name: 'Agent' as CollectionElementString, icon: Person, group: 'Core' },
        { name: 'API' as CollectionElementString, icon: Api, group: 'Core' },
        { name: 'APIConfig' as CollectionElementString, icon: Settings, group: 'Core' },
        { name: 'Chat' as CollectionElementString, icon: QuestionAnswer, group: 'Core' },
        { name: 'CodeExecution' as CollectionElementString, icon: Functions, group: 'Ref' },
        { name: 'DataCluster' as CollectionElementString, icon: Diversity2, group: 'Refs' },
        { name: 'EmbeddingChunk' as CollectionElementString, icon: Description, group: 'Ref' },
        { name: 'EntityReference' as CollectionElementString, icon: Link, group: 'Ref' },
        { name: 'File' as CollectionElementString, icon: AttachFile, group: 'Ref' },
        { name: 'Message' as CollectionElementString, icon: Message, group: 'Ref' },
        { name: 'Model' as CollectionElementString, icon: Category, group: 'Core' },
        { name: 'Parameter' as CollectionElementString, icon: Settings, group: 'Core' },
        { name: 'Prompt' as CollectionElementString, icon: Description, group: 'Core' },
        { name: 'Task' as CollectionElementString, icon: Functions, group: 'Core' },
        { name: 'TaskResponse' as CollectionElementString, icon: Assignment, group: 'Ref' },
        { name: 'ToolCall' as CollectionElementString, icon: Functions, group: 'Ref' },
        { name: 'UserCheckpoint' as CollectionElementString, icon: LiveHelp, group: 'Core' },
        { name: 'UserInteraction' as CollectionElementString, icon: Feedback, group: 'Ref' },
    ];

    // Active tab logic
    const handleViewModeChange = useCallback((event: React.MouseEvent<HTMLElement>, newMode: 'list' | 'shortList' | 'table' | null) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    }, []);

    const commonListProps = useMemo(() => ({
        mode: viewMode,
        fetchAll: true,
        onInteraction: handleItemSelect,
        onView: (item: any) => {
            Logger.debug('Viewing item:', item);
            if (item._id) {
                selectCardItem(activeTab, item._id);
            }
        },
        lastUpdate, // Pass lastUpdate to all list components
    }), [viewMode, handleItemSelect, selectCardItem, activeTab, lastUpdate]);

    const renderActiveList = useCallback(() => {
        return (
            <Box className={classes.activeListContainer}>
                <ToggleBox activeTab={activeTab} viewMode={viewMode} handleViewModeChange={handleViewModeChange} />
                <Box className={classes.activeListContent}>
                    {(() => {
                        switch (activeTab) {
                            case 'Agent':
                                return <EnhancedAgent {...commonListProps} />;
                            case 'Model':
                                return <EnhancedModel {...commonListProps} />;
                            case 'Parameter':
                                return <EnhancedParameter {...commonListProps} />;
                            case 'Prompt':
                                return <EnhancedPrompt {...commonListProps} />;
                            case 'Task':
                                return <EnhancedTask {...commonListProps} />;
                            case 'TaskResponse':
                                return <EnhancedTaskResponse {...commonListProps} />;
                            case 'Chat':
                                return <EnchancedChat {...commonListProps} />;
                            case 'API':
                                return <EnhancedAPI {...commonListProps} />;
                            case 'File':
                                return <EnhancedFile {...commonListProps} />;
                            case 'Message':
                                return <EnhancedMessage {...commonListProps} />;
                            case 'EntityReference':
                                return <EnhancedEntityReference {...commonListProps} />;
                            case 'UserCheckpoint':
                                return <EnhancedUserCheckpoint {...commonListProps} />;
                            case 'UserInteraction':
                                return <EnhancedUserInteraction {...commonListProps} />;
                            case 'EmbeddingChunk':
                                return <EnhancedEmbeddingChunk {...commonListProps} />;
                            case 'DataCluster':
                                return <EnhancedDataCluster {...commonListProps} />;
                            case 'APIConfig':
                                return <EnhancedAPIConfig {...commonListProps} />;
                            case 'CodeExecution':
                                return <EnhancedCodeExecution {...commonListProps} />;
                            case 'ToolCall':
                                return <EnhancedToolCall {...commonListProps} />;
                            default:
                                return null;
                        }
                    })()}
                </Box>
            </Box>
        );
    }, [activeTab, viewMode, handleViewModeChange, classes.activeListContainer, classes.activeListContent, commonListProps]);

    const renderActiveComponent = useCallback(() => {
        if (!showActiveComponent) {
            return (
                <PlaceholderSkeleton mode="compact" text='Select an item or create a new one to start configuring.' />
            );
        }

        const commonProps = {
            mode: (isCreating ? 'create' : 'edit') as ComponentMode,
            fetchAll: false,
            onSave: handleSave,
            onDelete: handleDelete,
            itemId: selectedItem?._id,
        };
        switch (activeTab) {
            case 'Agent':
                return <EnhancedAgent {...commonProps} />;
            case 'Model':
                return <EnhancedModel {...commonProps} />;
            case 'Parameter':
                return <EnhancedParameter {...commonProps} />;
            case 'Prompt':
                return <EnhancedPrompt {...commonProps} />;
            case 'Task':
                return <EnhancedTask {...commonProps} />;
            case 'TaskResponse':
                return <EnhancedTaskResponse {...commonProps} mode={'card'} />;
            case 'Chat':
                return <EnchancedChat {...commonProps} />;
            case 'API':
                return <EnhancedAPI {...commonProps} />;
            case 'File':
                return <EnhancedFile {...commonProps} />;
            case 'Message':
                return <EnhancedMessage {...commonProps} />;
            case 'EntityReference':
                return <EnhancedEntityReference {...commonProps} />;
            case 'UserCheckpoint':
                return <EnhancedUserCheckpoint {...commonProps} />;
            case 'UserInteraction':
                return <EnhancedUserInteraction {...commonProps} />;
            case 'EmbeddingChunk':
                return <EnhancedEmbeddingChunk {...commonProps} />;
            case 'DataCluster':
                return <EnhancedDataCluster {...commonProps} />;
            case 'APIConfig':
                return <EnhancedAPIConfig {...commonProps} />;
            case 'CodeExecution':
                return <EnhancedCodeExecution {...commonProps} />;
            case 'ToolCall':
                return <EnhancedToolCall {...commonProps} />;
            default:
                return null;
        }
    }, [activeTab, isCreating, selectedItem, handleSave, showActiveComponent, handleDelete]);

    return (
        <Box className={classes.databaseContainer}>
            <VerticalMenuSidebar
                actions={actions}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={useCallback((tab: CollectionElementString) => {
                    setActiveTab(tab);
                    setSelectedItem(null);
                    setIsCreating(false);
                    setShowActiveComponent(false);
                }, [setSelectedItem])}
                renderContent={renderActiveList}
                expandedWidth={viewMode === 'table' ? TASK_SIDEBAR_WIDTH_TABLE : viewMode === 'list' ? TASK_SIDEBAR_WIDTH : TASK_SIDEBAR_WIDTH_COMPACT}
                collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
            />
            <Box className={classes.databaseContent}>
                {renderActiveComponent()}
            </Box>
        </Box>
    );
};

export default Database;