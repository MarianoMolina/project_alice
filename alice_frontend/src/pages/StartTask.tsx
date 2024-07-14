import React, { useState } from 'react';
import { Box, Dialog, Typography, List } from '@mui/material';
import { Add, Functions, PlayArrow, Assignment } from '@mui/icons-material';
import { Card, CardContent, Skeleton, Stack } from '@mui/material';
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
    setTaskById,
  } = useTask();

  const executeTask = async (execution: RecentExecution) => {
    setTaskById(execution.taskId);
    setInputValues(execution.inputs);
    await handleExecuteTask();
    return selectedResult;
  };

  const [activeTab, setActiveTab] = useState('All Tasks');
  const [selectedResult, setSelectedResult] = useState<TaskResponse | null>(null);
  const [isTaskResultDialogOpen, setIsTaskResultDialogOpen] = useState(false);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);

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

  const taskPlaceholder = () => {
    return (
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">No task selected</Typography>
            <Typography>Please select a task from the sidebar to execute.</Typography>
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rounded" height={90} />
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const taskExecute = () => {
    if (!selectedTask) return taskPlaceholder();
    return <EnhancedTask mode={'execute'} itemId={selectedTask._id} fetchAll={false} />;
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
      <Box className={classes.mainContentContainer}>
        <Box className={classes.mainContent}>
          {taskExecute()}
        </Box>
        <Box className={classes.recentExecutionsContainer}>
          <Typography variant="h6">Recent Executions</Typography>
          {recentExecutions.length > 0 && (
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
                      ? () => executeTask(execution)
                      : undefined
                  }
                />
              ))}
            </List>
          )}
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
    </Box>
  );
};

export default StartTask;