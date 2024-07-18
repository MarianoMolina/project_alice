import React, { useState, useEffect } from 'react';
import { Box, Typography, List, IconButton, Tooltip, Dialog } from '@mui/material';
import { Add, Functions, PlayArrow, Assignment, ChevronRight, ChevronLeft } from '@mui/icons-material';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { TaskResponse } from '../utils/TaskResponseTypes';
import { AliceTask } from '../utils/TaskTypes';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import EnhancedTaskResponse from '../components/task_response/task_response/EnhancedTaskResponse';
import EnhancedTask from '../components/task/task/EnhancedTask';
import { RecentExecution, useTask } from '../context/TaskContext';
import useStyles from '../styles/StartTaskStyles';

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
  const [showRecentExecutions, setShowRecentExecutions] = useState(true);

  console.log('Render conditions:', { showRecentExecutions, recentExecutionsLength: recentExecutions.length });
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

  const tabs = [
    { name: 'Create Task', icon: Add },
    { name: 'All Tasks', icon: Functions },
    { name: 'Task Results', icon: Assignment },
    { name: 'Active Task', icon: PlayArrow, disabled: !selectedTask },
  ]

  const handleTabWhenTaskSelect = (task: AliceTask) => {
    if (task) {
      handleSelectTask(task);
      setActiveTab('Active Task');
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
        return <EnhancedTaskResponse onView={handleOpenTaskResult} mode={'list'} fetchAll={true} />;
      case 'All Tasks':
        return <EnhancedTask mode={'list'} fetchAll={true} onView={handleTaskClick} onInteraction={handleTabWhenTaskSelect} />;
      case 'Active Task':
        return selectedTask ? <EnhancedTask mode={'card'} itemId={selectedTask._id} fetchAll={false} /> : null;
      case 'Create Task':
        return <EnhancedTask mode={'create'} fetchAll={false} />;
    }
  };

  return (
    <Box className={classes.container}>
      <VerticalMenuSidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        renderContent={renderSidebarContent}
        expandedWidth={TASK_SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
      />
      <Box className={classes.mainContainer}>
        <Box className={classes.taskExecutionContainer}>
          {selectedTask ? (
            <EnhancedTask mode={'execute'} itemId={selectedTask._id} fetchAll={false} onExecute={executeTask}/>
          ) : (
            <Typography variant="h6">No task selected</Typography>
          )}
        </Box>
        {(showRecentExecutions && recentExecutions.length > 0) && (
          <Box className={classes.recentExecutionsContainer}>
            <Typography variant="h6">Recent Executions</Typography>
            <List>
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
          </Box>
        )}
        <Tooltip title={showRecentExecutions ? "Hide Recent Executions" : "Show Recent Executions"}>
          <IconButton 
            onClick={() => setShowRecentExecutions(!showRecentExecutions)}
            className={classes.toggleRecentExecutionsButton}
          >
            {showRecentExecutions ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Box>
      <Dialog open={isTaskResultDialogOpen} onClose={handleCloseTaskResult} fullWidth maxWidth="md">
        {selectedResult && <EnhancedTaskResponse itemId={selectedResult._id} fetchAll={false} mode={'card'} />}
      </Dialog>
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)}>
        {selectedTaskId && (
          <EnhancedTask itemId={selectedTaskId} mode={'card'} fetchAll={false} />
        )}
      </Dialog>
    </Box>
  );
};

export default StartTask;