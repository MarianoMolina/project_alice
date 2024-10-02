import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { Add, Person, Category, Settings, Description, Functions, Assignment, Api, AttachFile, Message, QuestionAnswer } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TASK_SIDEBAR_WIDTH_TABLE, TASK_SIDEBAR_WIDTH_COMPACT } from '../utils/Constants';
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
import { useCardDialog } from '../contexts/CardDialogContext';
import EnhancedFile from '../components/enhanced/file/file/EnhancedFile';
import EnhancedMessage from '../components/enhanced/message/message/EnhancedMessage';
import EnhancedURLReference from '../components/enhanced/url_reference/url_reference/EnhancedURLReference';
import Logger from '../utils/Logger';

const Database: React.FC = () => {
    const classes = useStyles();
    const [selectedItem, setSelectedItem] = useState<CollectionElement | null>(null);
    const { selectCardItem } = useCardDialog();
    const [activeTab, setActiveTab] = useState<CollectionElementString>('Agent');
    const [showActiveComponent, setShowActiveComponent] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'shortList' | 'table'>('list');

    const handleCreateNew = useCallback(() => {
        Logger.debug('Create new clicked');
        setSelectedItem(null);
        setIsCreating(true);
        setShowActiveComponent(true);
    }, [setSelectedItem]);

    const handleItemSelect = useCallback((item: CollectionElement | null) => {
        Logger.debug('Item selected:', item);
        setSelectedItem(item);
        setIsCreating(false);
        setShowActiveComponent(true);
    }, [setSelectedItem]);

    const handleSave = useCallback(async (item: CollectionElement | null) => {
        Logger.debug('Saving item:', item);
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
        { name: 'Agent' as CollectionElementString, icon: Person, group: 'Core' },
        { name: 'API' as CollectionElementString, icon: Api, group: 'Core' },
        { name: 'Chat' as CollectionElementString, icon: QuestionAnswer, group: 'Core' },
        { name: 'File' as CollectionElementString, icon: AttachFile, group: 'Ref' },
        { name: 'Message' as CollectionElementString, icon: Message, group: 'Ref' },
        { name: 'Model' as CollectionElementString, icon: Category, group: 'Core' },
        { name: 'Parameter' as CollectionElementString, icon: Settings, group: 'Core' },
        { name: 'Prompt' as CollectionElementString, icon: Description, group: 'Core' },
        { name: 'Task' as CollectionElementString, icon: Functions, group: 'Core' },
        { name: 'TaskResponse' as CollectionElementString, icon: Assignment, group: 'Ref' },
        { name: 'URLReference' as CollectionElementString, icon: Description, group: 'Ref' },
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
                Logger.debug('Viewing item:', item);
                if (item._id) {
                    selectCardItem(activeTab, item._id);
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
                        case 'File':
                            return <EnhancedFile {...commonProps} />;
                        case 'Message':
                            return <EnhancedMessage {...commonProps} />;
                        case 'URLReference':
                            return <EnhancedURLReference {...commonProps} />;
                        default:
                            return null;
                    }
                })()}
            </Box>
        );
    }, [activeTab, handleItemSelect, viewMode, handleViewModeChange, selectCardItem]);

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
            case 'File':
                return <EnhancedFile {...commonProps} />;
            case 'Message':
                return <EnhancedMessage {...commonProps} />;
            case 'URLReference':
                return <EnhancedURLReference {...commonProps} />;
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