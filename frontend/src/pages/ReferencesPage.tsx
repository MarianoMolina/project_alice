import React, { useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import {
    Add, Diversity2
} from '@mui/icons-material';
import {
    TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH,
    TASK_SIDEBAR_WIDTH_TABLE, TASK_SIDEBAR_WIDTH_COMPACT
} from '../utils/Constants';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import { ComponentMode, CollectionElement, CollectionElementString, CollectionPopulatedElement, getCollectionNameFromElement } from '../types/CollectionTypes';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import EnhancedFile from '../components/enhanced/file/file/EnhancedFile';
import EnhancedMessage from '../components/enhanced/message/message/EnhancedMessage';
import EnhancedUserInteraction from '../components/enhanced/user_interaction/user_interaction/EnhancedUserInteraction';
import EnhancedEmbeddingChunk from '../components/enhanced/embedding_chunk/embedding_chunk/EnhancedEmbeddingChunk';
import EnhancedDataCluster from '../components/enhanced/data_cluster/data_cluster/EnhancedDataCluster';
import EnhancedCodeExecution from '../components/enhanced/code_execution/code_execution/EnhancedCodeExecution';
import EnhancedToolCall from '../components/enhanced/tool_calls/tool_calls/EnhancedToolCall';
import useStyles from '../styles/DatabaseStyles';
import PlaceholderSkeleton from '../components/ui/placeholder_skeleton/PlaceholderSkeleton';
import { useCardDialog } from '../contexts/CardDialogContext';
import Logger from '../utils/Logger';
import ToggleBox from '../components/ui/sidetab_header/ToggleBox';
import EnhancedEntityReference from '../components/enhanced/entity_reference/entity_reference/EnhancedEntityReference';
import { collectionElementIcons } from '../utils/CollectionUtils';
import { useApi } from '../contexts/ApiContext';

const ReferencesPage: React.FC = () => {
    const classes = useStyles();
    const { fetchPopulatedItem } = useApi();
    const [selectedItem, setSelectedItem] = useState<CollectionPopulatedElement | null>(null);
    const { selectCardItem } = useCardDialog();
    const [activeTab, setActiveTab] = useState<CollectionElementString>('Message');
    const [showActiveComponent, setShowActiveComponent] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'shortList' | 'table'>('list');
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

    const tabs = [
        // Msg Group
        { name: 'Message' as CollectionElementString, icon: collectionElementIcons.Message, group: 'Msg' },
        { name: 'ToolCall' as CollectionElementString, icon: collectionElementIcons.ToolCall, group: 'Msg' },
        { name: 'CodeExecution' as CollectionElementString, icon: collectionElementIcons.CodeExecution, group: 'Msg' },

        // Task Group
        { name: 'TaskResponse' as CollectionElementString, icon: collectionElementIcons.TaskResponse, group: 'Task' },

        // File Group
        { name: 'File' as CollectionElementString, icon: collectionElementIcons.File, group: 'File' },

        // Misc Group
        { name: 'EmbeddingChunk' as CollectionElementString, icon: collectionElementIcons.EmbeddingChunk, group: 'Misc' },
        { name: 'UserInteraction' as CollectionElementString, icon: collectionElementIcons.UserInteraction, group: 'Misc' },
        { name: 'EntityReference' as CollectionElementString, icon: collectionElementIcons.EntityReference, group: 'Misc' },

        // Refs Group
        { name: 'DataCluster' as CollectionElementString, icon: Diversity2, group: 'Refs' },
    ];

    const handleCreateNew = useCallback(() => {
        Logger.debug('References - Create new clicked');
        setSelectedItem(null);
        setIsCreating(true);
        setShowActiveComponent(true);
    }, []);

    const handleItemSelect = useCallback(async (item: CollectionElement | CollectionPopulatedElement | null) => {
        Logger.debug('References - Item selected:', activeTab, item);
        if (!item) return;
        const collectionName = getCollectionNameFromElement(activeTab);
        const popItem = await fetchPopulatedItem(collectionName, item._id);
        Logger.debug('References - Populated item:', popItem);
        setSelectedItem(popItem as CollectionPopulatedElement);
        setIsCreating(false); 
        setShowActiveComponent(true);
    }, [activeTab, fetchPopulatedItem]);

    const handleSave = useCallback(async (item: CollectionElement | CollectionPopulatedElement | null) => {
        Logger.debug('References - Saving item:', item);
        setSelectedItem(null);
        setIsCreating(false);
        setShowActiveComponent(false);
        setLastUpdate(Date.now());
    }, []);

    const handleDelete = useCallback(async (item: any) => {
        Logger.debug('References - Deleting item:', item);
        setSelectedItem(null);
        setIsCreating(false);
        setShowActiveComponent(false);
        setLastUpdate(Date.now());
    }, []);

    const actions = [
        {
            name: `Create ${activeTab}`,
            icon: Add,
            action: handleCreateNew,
            disabled: activeTab === 'TaskResponse' || activeTab === 'EmbeddingChunk' || activeTab === 'UserInteraction',
        }
    ];

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
        lastUpdate,
    }), [viewMode, handleItemSelect, selectCardItem, activeTab, lastUpdate]);

    const renderActiveList = useCallback(() => {
        return (
            <Box className={classes.activeListContainer}>
                <ToggleBox activeTab={activeTab} viewMode={viewMode} handleViewModeChange={(_, newMode) => {
                    if (newMode !== null) setViewMode(newMode);
                }} />
                <Box className={classes.activeListContent}>
                    {(() => {
                        switch (activeTab) {
                            case 'TaskResponse':
                                return <EnhancedTaskResponse {...commonListProps} />;
                            case 'File':
                                return <EnhancedFile {...commonListProps} />;
                            case 'Message':
                                return <EnhancedMessage {...commonListProps} />;
                            case 'UserInteraction':
                                return <EnhancedUserInteraction {...commonListProps} />;
                            case 'EmbeddingChunk':
                                return <EnhancedEmbeddingChunk {...commonListProps} />;
                            case 'DataCluster':
                                return <EnhancedDataCluster {...commonListProps} />;
                            case 'CodeExecution':
                                return <EnhancedCodeExecution {...commonListProps} />;
                            case 'ToolCall':
                                return <EnhancedToolCall {...commonListProps} />;
                            case 'EntityReference':
                                return <EnhancedEntityReference {...commonListProps} />;
                            default:
                                return null;
                        }
                    })()}
                </Box>
            </Box>
        );
    }, [activeTab, viewMode, classes.activeListContainer, classes.activeListContent, commonListProps]);

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
            case 'TaskResponse':
                return <EnhancedTaskResponse {...commonProps} mode={'card'} />;
            case 'File':
                return <EnhancedFile {...commonProps} />;
            case 'Message':
                return <EnhancedMessage {...commonProps} />;
            case 'UserInteraction':
                return <EnhancedUserInteraction {...commonProps} />;
            case 'EmbeddingChunk':
                return <EnhancedEmbeddingChunk {...commonProps} />;
            case 'DataCluster':
                return <EnhancedDataCluster {...commonProps} />;
            case 'CodeExecution':
                return <EnhancedCodeExecution {...commonProps} />;
            case 'ToolCall':
                return <EnhancedToolCall {...commonProps} />;
            case 'EntityReference':
                return <EnhancedEntityReference {...commonProps} />;
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
                    Logger.debug('References - Tab changed:', tab);
                    setActiveTab(tab);
                    setSelectedItem(null);
                    setIsCreating(false);
                    setShowActiveComponent(false);
                }, [])}
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

export default ReferencesPage;