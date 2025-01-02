import React, { useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { 
  Add
} from '@mui/icons-material';
import { 
  TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH,
  TASK_SIDEBAR_WIDTH_TABLE, TASK_SIDEBAR_WIDTH_COMPACT 
} from '../utils/Constants';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import { ComponentMode, CollectionElement, CollectionElementString, CollectionPopulatedElement } from '../types/CollectionTypes';
import EnhancedAgent from '../components/enhanced/agent/agent/EnhancedAgent';
import EnhancedPrompt from '../components/enhanced/prompt/prompt/EnhancedPrompt';
import EnhancedModel from '../components/enhanced/model/model/EnhancedModel';
import EnhancedParameter from '../components/enhanced/parameter/parameter/EnhancedParameter';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import EnhancedChat from '../components/enhanced/chat/chat/EnhancedChat';
import EnhancedAPIConfig from '../components/enhanced/api_config/api_config/EnhancedAPIConfig';
import EnhancedUserCheckpoint from '../components/enhanced/user_checkpoint/user_checkpoint/EnhancedUserCheckpoint';
import useStyles from '../styles/DatabaseStyles';
import PlaceholderSkeleton from '../components/ui/placeholder_skeleton/PlaceholderSkeleton';
import { useDialog } from '../contexts/DialogContext';
import Logger from '../utils/Logger';
import ToggleBox from '../components/ui/sidetab_header/ToggleBox';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';
import { collectionElementIcons } from '../utils/CollectionUtils';

const StructuresPage: React.FC = () => {
    const classes = useStyles();
    const [selectedItem, setSelectedItem] = useState<CollectionPopulatedElement | null>(null);
    const { selectCardItem } = useDialog();
    const [activeTab, setActiveTab] = useState<CollectionElementString>('Agent');
    const [showActiveComponent, setShowActiveComponent] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'shortList' | 'table'>('list');
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
    const [isExpanded, setIsExpanded] = useState(true);

    const tabs = [
        // Core Group
        { name: 'Agent' as CollectionElementString, icon: collectionElementIcons.Agent, group: 'Core' },
        { name: 'Task' as CollectionElementString, icon: collectionElementIcons.Task, group: 'Core' },
        { name: 'Chat' as CollectionElementString, icon: collectionElementIcons.Chat, group: 'Core' },
        
        // API Group
        { name: 'API' as CollectionElementString, icon: collectionElementIcons.API, group: 'API' },
        { name: 'APIConfig' as CollectionElementString, icon: collectionElementIcons.APIConfig, group: 'API' },
        { name: 'Model' as CollectionElementString, icon: collectionElementIcons.Model, group: 'API' },
        
        // Misc Group
        { name: 'Prompt' as CollectionElementString, icon: collectionElementIcons.Prompt, group: 'Misc' },
        { name: 'Parameter' as CollectionElementString, icon: collectionElementIcons.Parameter, group: 'Misc' },
        { name: 'UserCheckpoint' as CollectionElementString, icon: collectionElementIcons.UserCheckpoint, group: 'Misc' },
        
    ];

    const handleCreateNew = useCallback(() => {
        Logger.debug('Structures - Create new clicked');
        setSelectedItem(null);
        setIsCreating(true);
        setShowActiveComponent(true);
    }, []);

    const handleItemSelect = useCallback((item: CollectionPopulatedElement | CollectionElement | null) => {
        Logger.debug('Structures - Item selected:', item);
        setSelectedItem(item as CollectionPopulatedElement);
        setIsCreating(false);
        setShowActiveComponent(true);
        setIsExpanded(false);
    }, []);

    const handleSave = useCallback(async (item: CollectionPopulatedElement | CollectionElement | null) => {
        Logger.debug('Structures - Saving item:', item);
        setSelectedItem(null);
        setIsCreating(false);
        setShowActiveComponent(false);
        setLastUpdate(Date.now());
    }, []);

    const handleDelete = useCallback(async (item: any) => {
        Logger.debug('Structures - Deleting item:', item);
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
                            case 'Chat':
                                return <EnhancedChat {...commonListProps} />;
                            case 'API':
                                return <EnhancedAPI {...commonListProps} />;
                            case 'APIConfig':
                                return <EnhancedAPIConfig {...commonListProps} />;
                            case 'UserCheckpoint':
                                return <EnhancedUserCheckpoint {...commonListProps} />;
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
            case 'Chat':
                return <EnhancedChat {...commonProps} />;
            case 'API':
                return <EnhancedAPI {...commonProps} />;
            case 'APIConfig':
                return <EnhancedAPIConfig {...commonProps} />;
            case 'UserCheckpoint':
                return <EnhancedUserCheckpoint {...commonProps} />;
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
                }, [])}
                renderContent={renderActiveList}
                expandedWidth={viewMode === 'table' ? TASK_SIDEBAR_WIDTH_TABLE : viewMode === 'list' ? TASK_SIDEBAR_WIDTH : TASK_SIDEBAR_WIDTH_COMPACT}
                collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
                expanded={isExpanded}
                onExpandedChange={setIsExpanded}
            />
            <Box className={classes.databaseContent}>
                {renderActiveComponent()}
            </Box>
        </Box>
    );
};

export default StructuresPage;