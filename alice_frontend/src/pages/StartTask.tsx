import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, List, Dialog, Accordion, AccordionSummary, AccordionDetails, Stack, Skeleton } from '@mui/material';
import { Add, Functions, Assignment, ExpandMore } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { TaskResponse } from '../types/TaskResponseTypes';
import { AliceTask } from '../types/TaskTypes';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import EnhancedTaskResponse from '../components/enhanced/task_response/task_response/EnhancedTaskResponse';
import EnhancedTask from '../components/enhanced/task/task/EnhancedTask';
import { RecentExecution, useTask } from '../context/TaskContext';
import useStyles from '../styles/StartTaskStyles';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';

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

  const [activeTab, setActiveTab] = useState('All Tasks');
  const [selectedResult, setSelectedResult] = useState<TaskResponse | null>(null);
  const [isTaskResultDialogOpen, setIsTaskResultDialogOpen] = useState(false);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [openTaskCreateDialog, setOpenTaskCreateDialog] = useState(false);
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    console.log('Recent executions in StartTask:', recentExecutions);
  }, [recentExecutions]);

  const executeTask = async () => {
    await handleExecuteTask();
  };

  const setAndRunTaskFromExecution = async (execution: RecentExecution) => {
    setTaskById(execution.taskId);
    setInputValues(execution.inputs);
    await handleExecuteTask();
  }

  const handleTaskClick = (task: AliceTask) => {
    setSelectedTaskId(task._id);
    setOpenTaskDialog(true);
  };

  const handleCreateNew = useCallback(() => {
    console.log('Create new clicked');
    setOpenTaskCreateDialog(true);
  }, []);

  const actions = [
    {
      name: `Create task`,
      icon: Add,
      action: handleCreateNew,
      disabled: activeTab === 'Task Results'
    }
  ];

  const tabs = [
    { name: 'All Tasks', icon: Functions },
    { name: 'Task Results', icon: Assignment },
  ]

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === 'All Tasks' || tabName === 'Task Results') {
      setListKey(prev => prev + 1);
    }
  };

  const handleTabWhenTaskSelect = (task: AliceTask) => {
    if (task) {
      handleSelectTask(task);
    }
  }

  const handleOpenTaskResult = (result: TaskResponse) => {
    console.log('Opening task result:', result);
    setSelectedResult(result);
    setIsTaskResultDialogOpen(true);
  };

  const handleCloseTaskResult = () => {
    setIsTaskResultDialogOpen(false);
    setSelectedResult(null);
  };

  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'Task Results':
        return <EnhancedTaskResponse key={listKey} onView={handleOpenTaskResult} mode={'list'} fetchAll={true} />;
      case 'All Tasks':
        return <EnhancedTask key={listKey} mode={'list'} fetchAll={true} onView={handleTaskClick} onInteraction={handleTabWhenTaskSelect} />;
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
              <Stack spacing={2}>
                  <Typography variant="h6">Please select a task to execute.</Typography>
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="rectangular" height={60} />
              </Stack>
          )}
        </Box>
        <Box className={classes.apiAndRecentExecutionsContainer}>
          <Box className={classes.apiStatusContainer}>
            <Typography variant="h6" className={classes.sectionTitle}>API Status</Typography>
            <Box className={classes.apiTooltipContainer}>
              <EnhancedAPI mode='tooltip' fetchAll={true} />
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
              <List className={classes.recentExecutionsList}>
                {recentExecutions.map((execution, index) => (
                  <EnhancedTaskResponse
                    key={index}
                    itemId={execution.result._id}
                    mode={'list'}
                    fetchAll={false}
                    onView={() => handleOpenTaskResult(execution.result)}
                    onInteraction={
                      selectedTask && execution.taskId === selectedTask._id
                        ? () => setAndRunTaskFromExecution(execution)
                        : undefined
                    }
                  />
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
      <Dialog open={isTaskResultDialogOpen} onClose={handleCloseTaskResult} fullWidth maxWidth="md">
        {selectedResult && <EnhancedTaskResponse itemId={selectedResult._id} fetchAll={false} mode={'card'} />}
      </Dialog>
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
        {selectedTaskId && (
          <EnhancedTask itemId={selectedTaskId} mode={'card'} fetchAll={false} />
        )}
      </Dialog>
      <Dialog open={openTaskCreateDialog} onClose={() => setOpenTaskCreateDialog(false)}>
        <EnhancedTask mode={'create'} fetchAll={false} />
      </Dialog>
    </Box>
  );
};

export default StartTask;