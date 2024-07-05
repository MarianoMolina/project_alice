import React, { useState } from 'react';
import { Box, Dialog } from '@mui/material';
import { Card, CardContent, Typography, Skeleton, Stack } from '@mui/material';
import EnhancedTaskResult from '../components/task_response/TaskResponse';
import { useTask } from '../context/TaskContext';
import useStyles from '../styles/StartTaskStyles';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { Add, Functions, PlayArrow, Assignment } from '@mui/icons-material';
import { TaskResponse } from '../utils/TaskResponseTypes';
import { AliceTask } from '../utils/TaskTypes';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import EnhancedTask from '../components/task/Task';

const StartTask: React.FC = () => {
  const classes = useStyles();
  const {
    selectedTask,
    handleSelectTask,
  } = useTask();

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
        return <EnhancedTaskResult onInteraction={handleOpenTaskResult} mode={'list'} fetchAll={true} />;
      case 'All Tasks':
        return <EnhancedTask mode={'list'} fetchAll={true} onInteraction={handleTaskClick} onAddTask={handleTabWhenTaskSelect} />;
      case 'Active Task':
        return selectedTask ? <EnhancedTask mode={'card'} itemId={selectedTask._id} fetchAll={false} /> : null;
      case 'Create Task':
        return <EnhancedTask mode={'create'} fetchAll={false} />;
    }
  };


  const taskPlaceholder = () => {
    return <Card className={classes.taskCard}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">No task selected</Typography>
          <Typography>Please select a task from the sidebar to execute.</Typography>
          <Skeleton variant="rectangular" height={80} />
          <Skeleton variant="rounded" height={90} />
        </Stack>
      </CardContent>
    </Card>
  }

  const taskExecute = () => {
    if (!selectedTask) return taskPlaceholder();
    return <EnhancedTask mode={'execute'} itemId={selectedTask._id} fetchAll={false} />;
  }

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
      <Box className={classes.mainContent}>
        {selectedTask ? taskExecute() : taskPlaceholder()}
      </Box>
      <Dialog open={isTaskResultDialogOpen} onClose={handleCloseTaskResult} fullWidth maxWidth="md">
        {selectedResult && <EnhancedTaskResult itemId={selectedResult._id} fetchAll={false} mode={'card'} />}
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