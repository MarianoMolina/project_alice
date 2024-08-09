import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { Add, Person, Category, Settings, Description, Functions, Assignment, Chat, Api } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TASK_SIDEBAR_WIDTH_TABLE } from '../utils/Constants';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import { ComponentMode, CollectionElement, CollectionElementString } from '../types/CollectionTypes';
import EnhancedAgent from '../components/enhanced/agent/agent/EnhancedAgent';
import EnhancedPrompt from '../components/enhanced/prompt/prompt/EnhancedPrompt';
import EnhancedModel from '../components/enhanced/model/model/EnhancedModel';
import EnhancedParameter from '../components/enhanced/parameter/parameter/EnhancedParameter';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import EnchancedChat from '../components/enhanced/chat/chat/EnhancedChat';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';
import useStyles from '../styles/DatabaseStyles';
import ToggleBox from '../components/ui/toggle_box/ToggleBox';
import PlaceholderSkeleton from '../components/ui/placeholder_skeleton/PlaceholderSkeleton';
import EnhancedCardDialog from '../components/enhanced/common/enhanced_card_dialog/EnhancedCardDialog';
import { useDialog } from '../context/DialogContext';

const Database: React.FC = () => {
    const classes = useStyles();
    const [selectedItem, setSelectedItem] = useState<CollectionElement | null>(null);
    const { selectItem } = useDialog();
    const [activeTab, setActiveTab] = useState<CollectionElementString>('Agent');
    const [showActiveComponent, setShowActiveComponent] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'shortList' | 'table'>('list');

    const handleCreateNew = useCallback(() => {
        console.log('Create new clicked');
        setSelectedItem(null);
        setIsCreating(true);
        setShowActiveComponent(true);
    }, [setSelectedItem]);

    const handleItemSelect = useCallback((item: CollectionElement | null) => {
        console.log('Item selected:', item);
        setSelectedItem(item);
        setIsCreating(false);
        setShowActiveComponent(true);
    }, [setSelectedItem]);

    const handleSave = useCallback(async (item: CollectionElement | null) => {
        console.log('Saving item:', item);
        setSelectedItem(null);
        setIsCreating(false);
        setShowActiveComponent(false);
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
        { name: 'Agent' as CollectionElementString, icon: Person },
        { name: 'Model' as CollectionElementString, icon: Category },
        { name: 'Parameter' as CollectionElementString, icon: Settings },
        { name: 'Prompt' as CollectionElementString, icon: Description },
        { name: 'Task' as CollectionElementString, icon: Functions },
        { name: 'TaskResponse' as CollectionElementString, icon: Assignment },
        { name: 'Chat' as CollectionElementString, icon: Chat },
        { name: 'API' as CollectionElementString, icon: Api },
    ];

    // Active tab logic
    const handleViewModeChange = useCallback((event: React.MouseEvent<HTMLElement>, newMode: 'list' | 'shortList' | 'table' | null) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    }, []);

    const renderActiveList = useCallback(() => {
        const commonProps = {
            mode: viewMode,
            fetchAll: true,
            onInteraction: handleItemSelect,
            onView: (item: any) => {
                if (item._id) {
                    selectItem(activeTab, item._id);
                }
            },
        };

        return (
            <Box>
                <ToggleBox activeTab={activeTab} viewMode={viewMode} handleViewModeChange={handleViewModeChange} />
                {(() => {
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
                            return <EnhancedTaskResponse {...commonProps} />;
                        case 'Chat':
                            return <EnchancedChat {...commonProps} />;
                        case 'API':
                            return <EnhancedAPI {...commonProps} />;
                        default:
                            return null;
                    }
                })()}
                <EnhancedCardDialog />
            </Box>
        );
    }, [activeTab, handleItemSelect, viewMode, handleViewModeChange, selectItem]);

    const renderActiveComponent = useCallback(() => {
        if (!showActiveComponent) {
            return (
                <PlaceholderSkeleton mode="compact" text='Select an item or create a new one to start configuring.'/>
            );
        }

        const commonProps = {
            mode: (isCreating ? 'create' : 'edit') as ComponentMode,
            fetchAll: false,
            onSave: handleSave,
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
                return <EnhancedAPI {...commonProps} fetchAll={true} />;
            default:
                return null;
        }
    }, [activeTab, isCreating, selectedItem, handleSave, showActiveComponent]);

    return (
        <Box className={classes.databaseContainer}>
            <VerticalMenuSidebar
                actions={actions}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={useCallback((tab: CollectionElementString) => {
                    console.log('Tab changed to:', tab);
                    setActiveTab(tab);
                    setSelectedItem(null);
                    setIsCreating(false);
                    setShowActiveComponent(false);
                }, [setSelectedItem])}
                renderContent={renderActiveList}
                expandedWidth={viewMode === 'table' ? TASK_SIDEBAR_WIDTH_TABLE : TASK_SIDEBAR_WIDTH}
                collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
            />
            <Box className={classes.databaseContent}>
                {renderActiveComponent()}
            </Box>
        </Box>
    );
};

export default Database;