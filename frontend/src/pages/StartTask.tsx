import React, { useCallback, useMemo, useState } from 'react';
import { Box, Typography, List, Accordion, AccordionSummary, AccordionDetails, SelectChangeEvent } from '@mui/material';
import { Add, Functions, Assignment, ExpandMore } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { AliceTask, TaskType } from '../types/TaskTypes';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import { RecentExecution, useTask } from '../contexts/TaskContext';
import useStyles from '../styles/StartTaskStyles';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';
import PlaceholderSkeleton from '../components/ui/placeholder_skeleton/PlaceholderSkeleton';
import { CollectionElementString } from '../types/CollectionTypes';
import { useCardDialog } from '../contexts/CardDialogContext';
import { API } from '../types/ApiTypes';
import TaskShortListView from '../components/enhanced/task/task/TaskShortListView';
import FilterSelect from '../components/ui/sidetab_header/FilterSelect';

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

  const executeTask = async () => {
    await handleExecuteTask();
  };

  const setTaskFromExecution = async (execution: RecentExecution) => {
    setTaskById(execution.taskId);
    setInputValues(execution.inputs);
  }

  const handleTaskTypeChange = useCallback((event: SelectChangeEvent<string>) => {
    setSelectedTaskType(event.target.value);
  }, []);

  const filteredTasks = useMemo(() => {
    if (!selectedTaskType) return tasks;
    return tasks.filter(task => task.task_type === selectedTaskType);
  }, [tasks, selectedTaskType]);


  const actions = [
    {
      name: `Create task`,
      icon: Add,
      action: () => selectFlexibleItem('Task', 'create'),
    }
  ];

  const tabs = [
    { name: 'Task' as CollectionElementString, icon: Functions, group: 'Task' },
    { name: 'TaskResponse' as CollectionElementString, icon: Assignment, group: 'Out' },
  ]

  const handleTabChange = (tabName: CollectionElementString) => {
    setActiveTab(tabName);
    if (tabName === 'Task' || tabName === 'TaskResponse') {
      setListKey(prev => prev + 1);
    }
  };

  const handleTabWhenTaskSelect = (task: AliceTask) => {
    if (task) {
      handleSelectTask(task);
    }
  }

  const triggerItemDialog = (collectionName: CollectionElementString, itemId: string) => {
    selectCardItem(collectionName, itemId);
  };

  const renderSidebarContent = () => {

    return (
      <Box className={classes.activeListContainer}>
        {activeTab === 'Task' && (
          <FilterSelect
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
                return <EnhancedTaskResponse
                  key={listKey}
                  onView={(taskResult) => taskResult._id && triggerItemDialog('TaskResponse', taskResult._id)}
                  mode={'list'}
                  fetchAll={true}
                />;
              case 'Task':
                return <TaskShortListView
                  items={filteredTasks}
                  onView={(task) => task._id && triggerItemDialog('Task', task._id)}
                  onInteraction={handleTabWhenTaskSelect}
                  item={null} mode={'view'}
                  onChange={() => null}
                  handleSave={async () => { }}
                />
              default:
                return null;
            }
          })()}
        </Box>
      </Box>
    )
  };

  return (
    <Box className={classes.container}>
      <VerticalMenuSidebar
        actions={actions}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        renderContent={renderSidebarContent}
        expandedWidth={TASK_SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
      />
      <Box className={classes.mainContainer}>
        <Box className={classes.taskExecutionContainer}>
          {selectedTask ? (
            <EnhancedTask mode={'execute'} itemId={selectedTask._id} fetchAll={false} onExecute={executeTask} />
          ) : (
            <PlaceholderSkeleton mode="task" text='Select a task to execute.' />
          )}
        </Box>
        <Box className={classes.apiAndRecentExecutionsContainer}>
          <Box className={classes.apiStatusContainer}>
            <Typography variant="h6" className={classes.sectionTitle}>API Status</Typography>
            <Box className={classes.apiTooltipContainer}>
              <EnhancedAPI mode='tooltip' fetchAll={true} onInteraction={(api: API) => api._id && triggerItemDialog('API', api._id)} />
            </Box>
          </Box>
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
                    <EnhancedTaskResponse
                      key={index}
                      itemId={execution.result._id}
                      mode={'list'}
                      fetchAll={false}
                      onView={() => execution.result._id && triggerItemDialog('TaskResponse', execution.result._id)}
                      onInteraction={
                        selectedTask && execution.taskId === selectedTask._id
                          ? () => setTaskFromExecution(execution)
                          : undefined
                      }
                    />
                  ))}
                </List>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
    </Box>
  );
};

export default StartTask;