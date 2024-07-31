import React, { useState, useCallback } from 'react';
import { Box, Stack, Typography, Skeleton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Add, Person, Mode, Settings, Description, Functions, Assignment, Chat, Api, ViewList, List, TableChart } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import { ComponentMode } from '../utils/CollectionTypes';
import { AliceModel } from '../utils/ModelTypes';
import { Prompt } from '../utils/PromptTypes';
import { ParameterDefinition } from '../utils/ParameterTypes';
import { AliceTask } from '../utils/TaskTypes';
import { TaskResponse } from '../utils/TaskResponseTypes';
import { AliceAgent } from '../utils/AgentTypes';
import { AliceChat } from '../utils/ChatTypes';
import { API } from '../utils/ApiTypes';
import EnhancedAgent from '../components/enhanced/agent/agent/EnhancedAgent';
import EnhancedPrompt from '../components/enhanced/prompt/prompt/EnhancedPrompt';
import EnhancedModel from '../components/enhanced/model/model/EnhancedModel';
import EnhancedParameter from '../components/enhanced/parameter/parameter/EnhancedParameter';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import EnchancedChat from '../components/enhanced/chat/chat/EnhancedChat';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';
import { useConfig } from '../context/ConfigContext';
import useStyles from '../styles/DatabaseStyles';

const Database: React.FC = () => {
    const classes = useStyles();
    const { selectedItem, setSelectedItem, refreshItems } = useConfig();
    const [activeTab, setActiveTab] = useState('Agent');
    const [showActiveComponent, setShowActiveComponent] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'shortList' | 'table'>('list');

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
            disabled: activeTab === 'Task Results'
        }
    ];

    const tabs = [
        { name: 'Agent', icon: Person },
        { name: 'Model', icon: Mode },
        { name: 'Parameter', icon: Settings },
        { name: 'Prompt', icon: Description },
        { name: 'Task', icon: Functions },
        { name: 'Task Results', icon: Assignment },
        { name: 'Chat', icon: Chat },
        { name: 'API', icon: Api },
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
            onView: handleItemSelect,
        };

        return (
            <Box>
                <Box className={classes.toggleBox}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        aria-label="view mode"
                    >
                        <ToggleButton value="list" aria-label="list view">
                            <List />
                        </ToggleButton>
                        <ToggleButton value="shortList" aria-label="short list view">
                            <ViewList />
                        </ToggleButton>
                        <ToggleButton value="table" aria-label="table view">
                            <TableChart />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
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
                        case 'Task Results':
                            return <EnhancedTaskResponse {...commonProps} />;
                        case 'Chat':
                            return <EnchancedChat {...commonProps} />;
                        case 'API':
                            return <EnhancedAPI {...commonProps} />;
                        default:
                            return null;
                    }
                })()}
            </Box>
        );
    }, [activeTab, handleItemSelect, viewMode, handleViewModeChange, classes.toggleBox]);

    const renderActiveComponent = useCallback(() => {
        if (!showActiveComponent) {
            return (
                <Stack spacing={1}>
                    <Typography variant="h6">Please select an item or create a new one to start configuring.</Typography>
                    <Skeleton variant="rectangular" height={40} />
                    <Skeleton variant="rectangular" height={40} />
                    <Skeleton variant="rectangular" height={40} />
                    <Skeleton variant="rectangular" height={40} />
                    <Skeleton variant="rectangular" height={40} />
                    <Skeleton variant="rectangular" height={40} />
                </Stack>
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
            case 'Task Results':
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
                onTabChange={useCallback((tab) => {
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