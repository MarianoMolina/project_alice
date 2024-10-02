import React, { useState } from 'react';
import { Box, Typography, List, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Add, Functions, Assignment, ExpandMore } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { AliceTask } from '../types/TaskTypes';
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

const StartTask: React.FC = () => {
  const classes = useStyles();
  const {
    selectedTask,
    handleSelectTask,
    recentExecutions,
    handleExecuteTask,
    setInputValues,
    setTaskById
  } = useTask();
  const { selectCardItem, selectFlexibleItem } = useCardDialog();

  const [activeTab, setActiveTab] = useState<CollectionElementString>('Task');
  const [listKey, setListKey] = useState(0);

  const executeTask = async () => {
    await handleExecuteTask();
  };

  const setAndRunTaskFromExecution = async (execution: RecentExecution) => {
    setTaskById(execution.taskId);
    setInputValues(execution.inputs);
    await handleExecuteTask();
  }

  const actions = [
    {
      name: `Create task`,
      icon: Add,
      action: () => selectFlexibleItem('Task', 'create'),
      disabled: activeTab === 'TaskResponse'
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
    switch (activeTab) {
      case 'TaskResponse':
        return <EnhancedTaskResponse
          key={listKey}
          onView={(taskResult) => taskResult._id && triggerItemDialog('TaskResponse', taskResult._id)}
          mode={'list'}
          fetchAll={true}
        />;
      case 'Task':
        return <EnhancedTask
          key={listKey}
          mode={'shortList'}
          fetchAll={true}
          onView={(task) => task._id && triggerItemDialog('Task', task._id)}
          onInteraction={handleTabWhenTaskSelect}
        />;
      default:
        return null;
    }
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
                          ? () => setAndRunTaskFromExecution(execution)
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