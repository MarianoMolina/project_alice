import React, { useState } from 'react';
import { Box, Dialog } from '@mui/material';
import TaskVerticalMenu from '../components/task/TaskVerticalMenu';
import TaskResultTable from '../components/task/TaskResultTable';
import TaskList from '../components/task/TaskList';
import TaskDetail from '../components/task/TaskDetail';
import TaskExecute from '../components/task/TaskExecute';
import Task from '../components/db_elements/Task';
import NewTask from '../components/db_elements/NewTask';
import TaskResult from '../components/db_elements/TaskResult';
import { useTask } from '../context/TaskContext';
import useStyles from '../styles/StartTaskStyles';
import { TASK_SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../utils/constants';
import { TaskResponse } from '../utils/types';

const StartTask: React.FC = () => {
  const classes = useStyles();
  const {
    tasks,
    selectedTask,
    taskResults,
    inputValues,
    executionStatus,
    handleSelectTask,
    handleInputChange,
    handleExecuteTask,
  } = useTask();

  const [activeTab, setActiveTab] = useState<'taskResults' | 'allTasks' | 'activeTask' | 'createTask'>('allTasks');
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedResult, setSelectedResult] = useState<TaskResponse | null>(null);
  const [isTaskResultDialogOpen, setIsTaskResultDialogOpen] = useState(false);

  const handleTabChange = (newTab: 'taskResults' | 'allTasks' | 'activeTask' | 'createTask') => {
    if (newTab === activeTab) {
      setIsExpanded(!isExpanded);
    } else {
      setActiveTab(newTab);
      setIsExpanded(true);
    }
  };

  const handleOpenTaskResult = (result: TaskResponse) => {
    setSelectedResult(result);
    setIsTaskResultDialogOpen(true);
  };

  const handleCloseTaskResult = () => {
    setIsTaskResultDialogOpen(false);
    setSelectedResult(null);
  };

  const renderSidebarContent = () => {
    if (!isExpanded) return null;

    switch (activeTab) {
      case 'taskResults':
        return <TaskResultTable taskResults={taskResults} setSelectedResult={handleOpenTaskResult} />;
      case 'allTasks':
        return <TaskList tasks={tasks} onSelectTask={handleSelectTask} />;
      case 'activeTask':
        return selectedTask ? <TaskDetail task={selectedTask} /> : null;
      case 'createTask':
        return <NewTask onTaskCreated={() => null}/>;
    }
  };

  return (
    <Box className={classes.container}>
      <Box 
        className={classes.sidebar}
        style={{ width: isExpanded ? TASK_SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH }}
      >
        <TaskVerticalMenu
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isActiveTaskDisabled={!selectedTask}
          isExpanded={isExpanded}
        />
        <Box className={classes.sidebarContent}>
          {renderSidebarContent()}
        </Box>
      </Box>
      <Box className={classes.mainContent}>
        <TaskExecute
          selectedTask={selectedTask}
          inputValues={inputValues}
          handleInputChange={handleInputChange}
          handleExecuteTask={async () => {
            await handleExecuteTask();
            if (selectedResult) {
              handleOpenTaskResult(selectedResult);
            }
          }}
          executionStatus={executionStatus}
        />
      </Box>
      <Dialog open={isTaskResultDialogOpen} onClose={handleCloseTaskResult} fullWidth maxWidth="md">
        {selectedResult && <TaskResult taskResponse={selectedResult} />}
      </Dialog>
    </Box>
  );
};

export default StartTask;