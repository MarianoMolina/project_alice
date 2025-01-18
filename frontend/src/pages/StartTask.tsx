import React, { useCallback, useMemo, useState, memo } from 'react';
import { Box, Typography, SelectChangeEvent, CircularProgress } from '@mui/material';
import { Add, Functions, Assignment } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { AliceTask, PopulatedTask, TaskType } from '../types/TaskTypes';
import { CollectionElementString } from '../types/CollectionTypes';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import PlaceholderSkeleton from '../components/ui/placeholder_skeleton/PlaceholderSkeleton';
import TaskListView from '../components/enhanced/task/task/TaskListView';
import FilterSelect from '../components/ui/sidetab_header/FilterSelect';
import { useDialog } from '../contexts/DialogContext';
import { RecentExecution, useTask } from '../contexts/TaskContext';
import useStyles from '../styles/StartTaskStyles';
import { APIStatusSection } from '../components/ui/task_interface/ApiStatus';
import { RecentExecutionsSection } from '../components/ui/task_interface/RecentExecutions';
import TaskExecuteView from '../components/ui/task_interface/TaskExecuteView';

const TaskLoadingState = memo(() => {
    const classes = useStyles();

    return (
        <Box className={classes.loadingContainer} display="flex" alignItems="center" justifyContent="center">
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ ml: 2 }}>
                Loading task details...
            </Typography>
        </Box>
    );
});

interface MemoizedSidebarProps {
    actions: Array<{
        name: string;
        icon: any;
        action: () => void;
    }>;
    tabs: Array<{
        name: CollectionElementString;
        icon: any;
        group: string;
    }>;
    activeTab: CollectionElementString;
    onTabChange: (tab: CollectionElementString) => void;
    renderContent: () => React.ReactNode;
    expandedWidth: number;
    collapsedWidth: number;
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
}

const MemoizedVerticalMenuSidebar = memo(({
    actions,
    tabs,
    activeTab,
    onTabChange,
    renderContent,
    expandedWidth,
    collapsedWidth,
    expanded,
    onExpandedChange,
}: MemoizedSidebarProps) => (
    <VerticalMenuSidebar
        actions={actions}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        renderContent={renderContent}
        expandedWidth={expandedWidth}
        collapsedWidth={collapsedWidth}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
    />
));

// Define prop types for memoized components
interface FilterSelectProps {
    title: CollectionElementString;
    currentSelection: string;
    options: TaskType[];
    handleSelectionChange: (event: SelectChangeEvent<string>) => void;
}

interface TaskListProps {
    items: AliceTask[] | PopulatedTask[];
    onView: (task: AliceTask | PopulatedTask) => void;
    onInteraction: (task: AliceTask | PopulatedTask) => void;
}

interface TaskExecuteProps {
    item: AliceTask | PopulatedTask;
    onExecute: () => Promise<void>;
}


// Memoized components with proper types
const MemoizedFilterSelect = memo(({ title, currentSelection, options, handleSelectionChange }: FilterSelectProps) => (
    <FilterSelect
        title={title}
        currentSelection={currentSelection}
        options={options}
        handleSelectionChange={handleSelectionChange}
    />
));

const MemoizedTaskListView = memo(({ items, onView, onInteraction }: TaskListProps) => (
    <TaskListView
        items={items}
        onView={onView}
        onInteraction={onInteraction}
        item={null}
        mode="view"
        onChange={() => null}
        handleSave={async () => { }}
    />
));

const MemoizedTaskExecuteView = memo(({ item, onExecute }: TaskExecuteProps) => (
    <TaskExecuteView
        item={item}
        onExecute={onExecute}
    />
));

const StartTask: React.FC = () => {
    const classes = useStyles();
    const {
        selectedTask,
        handleSelectTask,
        recentExecutions,
        handleExecuteTask,
        setInputValues,
        setTaskById,
        tasks,
        selectionStatus
    } = useTask();
    const { selectCardItem, selectFlexibleItem } = useDialog();

    const [activeTab, setActiveTab] = useState<CollectionElementString>('Task');
    const [listKey, setListKey] = useState(0);
    const [selectedTaskType, setSelectedTaskType] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState(true);

    const executeTask = useCallback(async () => {
        await handleExecuteTask();
    }, [handleExecuteTask]);

    const setTaskFromExecution = useCallback(async (execution: RecentExecution) => {
        setTaskById(execution.taskId);
        setInputValues(execution.inputs);
    }, [setTaskById, setInputValues]);

    const handleTaskTypeChange = useCallback((event: SelectChangeEvent<string>) => {
        setSelectedTaskType(event.target.value);
    }, []);

    const filteredTasks = useMemo(() => {
        if (!selectedTaskType) return tasks;
        return tasks.filter(task => task.task_type === selectedTaskType);
    }, [tasks, selectedTaskType]);

    const actions = useMemo(() => ([{
        name: 'Create task',
        icon: Add,
        action: () => selectFlexibleItem('Task', 'create'),
    }]), [selectFlexibleItem]);

    const tabs = useMemo(() => ([
        { name: 'Task' as CollectionElementString, icon: Functions, group: 'Task' },
        { name: 'TaskResponse' as CollectionElementString, icon: Assignment, group: 'Out' },
    ]), []);

    const handleTabChange = useCallback((tabName: CollectionElementString) => {
        setActiveTab(tabName);
        if (tabName === 'Task' || tabName === 'TaskResponse') {
            setListKey(prev => prev + 1);
        }
    }, []);

    const handleTabWhenTaskSelect = useCallback((task: AliceTask | PopulatedTask) => {
        if (task) {
            handleSelectTask(task);
            setIsExpanded(false);
        }
    }, [handleSelectTask]);

    const handleExecutionView = useCallback((execution: RecentExecution) => {
        if (execution.result._id) {
            selectCardItem('TaskResponse', execution.result._id);
        }
    }, [selectCardItem]);

    const handleTaskView = useCallback((task: AliceTask | PopulatedTask) => {
        if (task._id) {
            selectCardItem('Task', task._id);
        }
    }, [selectCardItem]);

    const renderSidebarContent = useCallback(() => {
        return (
            <Box className={classes.activeListContainer}>
                {activeTab === 'Task' && (
                    <MemoizedFilterSelect
                        title={activeTab}
                        currentSelection={selectedTaskType}
                        options={Object.values(TaskType)}
                        handleSelectionChange={handleTaskTypeChange}
                    />
                )}
                <Box className={classes.activeListContent}>
                    {(() => {
                        switch (activeTab) {
                            case 'TaskResponse':
                                return (
                                    <EnhancedTaskResponse
                                        key={listKey}
                                        onView={(taskResult) => taskResult._id && selectCardItem('TaskResponse', taskResult._id)}
                                        mode="list"
                                        fetchAll={true}
                                    />
                                );
                            case 'Task':
                                return (
                                    <MemoizedTaskListView
                                        items={filteredTasks as AliceTask[] | PopulatedTask[]}
                                        onView={handleTaskView}
                                        onInteraction={handleTabWhenTaskSelect}
                                    />
                                );
                            default:
                                return null;
                        }
                    })()}
                </Box>
            </Box>
        );
    }, [
        activeTab,
        selectedTaskType,
        filteredTasks,
        listKey,
        handleTaskTypeChange,
        handleTaskView,
        handleTabWhenTaskSelect,
        selectCardItem,
        classes
    ]);
    const renderTaskExecutionContent = () => {
        if (selectionStatus === 'loading') {
            return <TaskLoadingState />;
        }

        if (selectionStatus === 'error') {
            return (
                <PlaceholderSkeleton
                    mode="task"
                    text="Error loading task. Please try selecting again."
                />
            );
        }

        if (!selectedTask) {
            return (
                <PlaceholderSkeleton
                    mode="task"
                    text="Select a task to execute."
                />
            );
        }

        return (
            <MemoizedTaskExecuteView
                item={selectedTask}
                onExecute={executeTask}
            />
        );
    };
    return (
        <Box className={classes.container}>
            <MemoizedVerticalMenuSidebar
                actions={actions}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                renderContent={renderSidebarContent}
                expandedWidth={TASK_SIDEBAR_WIDTH}
                collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
                expanded={isExpanded}
                onExpandedChange={setIsExpanded}
            />
            <Box className={classes.mainContainer}>
                <Box className={classes.taskExecutionContainer}>
                    {renderTaskExecutionContent()}
                </Box>
                <Box className={classes.apiAndRecentExecutionsContainer}>
                    <APIStatusSection />
                    <RecentExecutionsSection
                        recentExecutions={recentExecutions}
                        selectedTask={selectedTask}
                        onExecutionView={handleExecutionView}
                        onExecutionInteraction={setTaskFromExecution}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default StartTask;