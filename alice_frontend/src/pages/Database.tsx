import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { Add, Person, Category, Settings, Description, Functions, Assignment, Chat, Api } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import { ComponentMode } from '../types/CollectionTypes';
import { AliceModel } from '../types/ModelTypes';
import { Prompt } from '../types/PromptTypes';
import { ParameterDefinition } from '../types/ParameterTypes';
import { AliceTask } from '../types/TaskTypes';
import { TaskResponse } from '../types/TaskResponseTypes';
import { AliceAgent } from '../types/AgentTypes';
import { AliceChat } from '../types/ChatTypes';
import { API } from '../types/ApiTypes';
import EnhancedAgent from '../components/enhanced/agent/agent/EnhancedAgent';
import EnhancedPrompt from '../components/enhanced/prompt/prompt/EnhancedPrompt';
import EnhancedModel from '../components/enhanced/model/model/EnhancedModel';
import EnhancedParameter from '../components/enhanced/parameter/parameter/EnhancedParameter';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import EnchancedChat from '../components/enhanced/chat/chat/EnhancedChat';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';
import { useConfig, ConfigItemType } from '../context/ConfigContext';
import useStyles from '../styles/DatabaseStyles';
import ToggleBox from '../components/ui/toggle_box/ToggleBox';
import PlaceholderSkeleton from '../components/ui/placeholder_skeleton/PlaceholderSkeleton';
import EnhancedCardDialogs from '../components/enhanced/common/enhanced_card_dialogs/EnhancedCardDialogs';

const Database: React.FC = () => {
    const classes = useStyles();
    const { selectedItem, setSelectedItem, refreshItems, triggerItemDialog } = useConfig();
    const [activeTab, setActiveTab] = useState<ConfigItemType>('Agent');
    const [showActiveComponent, setShowActiveComponent] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'shortList' | 'table'>('shortList');

    const handleCreateNew = useCallback(() => {
        console.log('Create new clicked');
        setSelectedItem(null);
        setIsCreating(true);
        setShowActiveComponent(true);
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
        { name: 'Agent' as ConfigItemType, icon: Person },
        { name: 'Model' as ConfigItemType, icon: Category },
        { name: 'Parameter' as ConfigItemType, icon: Settings },
        { name: 'Prompt' as ConfigItemType, icon: Description },
        { name: 'Task' as ConfigItemType, icon: Functions },
        { name: 'TaskResponse' as ConfigItemType, icon: Assignment },
        { name: 'Chat' as ConfigItemType, icon: Chat },
        { name: 'API' as ConfigItemType, icon: Api },
    ];

    const handleItemSelect = useCallback((item: AliceAgent | AliceModel | ParameterDefinition | Prompt | AliceTask | TaskResponse | AliceChat | API) => {
        console.log('Item selected:', item);
        setSelectedItem(item);
        setIsCreating(false);
        setShowActiveComponent(true);
    }, [setSelectedItem]);

    const handleSave = useCallback(async (item: AliceAgent | AliceModel | ParameterDefinition | Prompt | AliceTask | TaskResponse | AliceChat | API) => {
        console.log('Saving item:', item);
        await refreshItems();
        setSelectedItem(null);
        setIsCreating(false);
        setShowActiveComponent(false);
    }, [refreshItems, setSelectedItem]);

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
                    triggerItemDialog(activeTab, item._id);
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
                <EnhancedCardDialogs />
            </Box>
        );
    }, [activeTab, handleItemSelect, viewMode, handleViewModeChange, triggerItemDialog]);

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
                onTabChange={useCallback((tab: ConfigItemType) => {
                    console.log('Tab changed to:', tab);
                    setActiveTab(tab);
                    setSelectedItem(null);
                    setIsCreating(false);
                    setShowActiveComponent(false);
                }, [setSelectedItem])}
                renderContent={renderActiveList}
                expandedWidth={TASK_SIDEBAR_WIDTH}
                collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
            />
            <Box className={classes.databaseContent}>
                {renderActiveComponent()}
            </Box>
        </Box>
    );
};

export default Database;