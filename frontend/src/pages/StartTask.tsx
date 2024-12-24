import React, { useCallback, useMemo, useState, memo } from 'react';
import { Box, Typography, List, Accordion, AccordionSummary, AccordionDetails, SelectChangeEvent } from '@mui/material';
import { Add, Functions, Assignment, ExpandMore } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { AliceTask, PopulatedTask, TaskType } from '../types/TaskTypes';
import { APIConfig } from '../types/ApiConfigTypes';
import { CollectionElementString } from '../types/CollectionTypes';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import PlaceholderSkeleton from '../components/ui/placeholder_skeleton/PlaceholderSkeleton';
import TaskListView from '../components/enhanced/task/task/TaskListView';
import FilterSelect from '../components/ui/sidetab_header/FilterSelect';
import EnhancedAPIConfig from '../components/enhanced/api_config/api_config/EnhancedAPIConfig';
import TaskExecuteView from '../components/enhanced/task/task/TaskExecuteView';
import TaskResponseListView from '../components/enhanced/task_response/task_response/TaskResponseListView';
import { useCardDialog } from '../contexts/CardDialogContext';
import { RecentExecution, useTask } from '../contexts/TaskContext';
import useStyles from '../styles/StartTaskStyles';

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

interface TaskResponseProps {
    execution: RecentExecution;
    onView: () => void;
    onInteraction?: () => void;
}

interface RecentExecutionsSectionProps {
    recentExecutions: RecentExecution[];
    selectedTask: PopulatedTask | null;
    onExecutionView: (execution: RecentExecution) => void;
    onExecutionInteraction: (execution: RecentExecution) => void;
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
        items={null}
        onChange={() => null}
        mode="view"
        handleSave={async () => { }}
        onExecute={onExecute}
    />
));

const MemoizedTaskResponseListView = memo(({ execution, onView, onInteraction }: TaskResponseProps) => (
    <TaskResponseListView
        item={execution.result}
        items={null}
        mode="view"
        onChange={() => null}
        handleSave={async () => { }}
        onView={onView}
        onInteraction={onInteraction}
    />
));

const APIStatusSection = memo(() => {
    const classes = useStyles();
    const { selectCardItem } = useCardDialog();

    const handleApiConfigInteraction = useCallback((apiConfig: APIConfig) => {
        if (apiConfig._id) selectCardItem('APIConfig', apiConfig._id);
    }, [selectCardItem]);

    return (
        <Box className={classes.apiStatusContainer}>
            <Typography variant="h6" className={classes.sectionTitle}>API Status</Typography>
            <Box className={classes.apiTooltipContainer}>
                <EnhancedAPIConfig
                    mode="tooltip"
                    fetchAll={true}
                    onInteraction={handleApiConfigInteraction}
                />
            </Box>
        </Box>
    );
});

const RecentExecutionsSection = memo(({
    recentExecutions,
    selectedTask,
    onExecutionView,
    onExecutionInteraction
}: RecentExecutionsSectionProps) => {
    const classes = useStyles();

    return (
        <Accordion
            className={classes.recentExecutionsAccordion}
            defaultExpanded
            classes={{
                root: classes.accordionRoot,
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="recent-executions-content"
                id="recent-executions-header"
                className={classes.recentExecutionsAccordionSummary}
            >
                <Typography variant="h6" className={classes.sectionTitle}>Recent Executions</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.recentExecutionsAccordionDetails}>
                <Box component="div">
                    <List className={classes.recentExecutionsList}>
                        {recentExecutions.map((execution, index) => (
                            <MemoizedTaskResponseListView
                                key={index}
                                execution={execution}
                                onView={() => onExecutionView(execution)}
                                onInteraction={
                                    selectedTask && execution.taskId === selectedTask._id
                                        ? () => onExecutionInteraction(execution)
                                        : undefined
                                }
                            />
                        ))}
                    </List>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
});

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
    } = useTask();
    const { selectCardItem, selectFlexibleItem } = useCardDialog();

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
                    {selectedTask ? (
                        <MemoizedTaskExecuteView
                            item={selectedTask}
                            onExecute={executeTask}
                        />
                    ) : (
                        <PlaceholderSkeleton mode="task" text="Select a task to execute." />
                    )}
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