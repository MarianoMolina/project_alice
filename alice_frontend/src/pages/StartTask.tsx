import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import TaskSidebar from '../components/task/TaskSidebar';
import TaskResult from '../components/db_elements/TaskResult';
import TaskResultTable from '../components/task/TaskResultTable';
import TaskExecute from '../components/task/TaskExecute';
import { AliceTask, TaskResponse } from '../utils/types';
import { fetchItem, executeTask } from '../services/api';
import useStyles from '../styles/StartTaskStyles';
import Task from '../components/db_elements/Task';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  const classes = useStyles();
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      className={classes.tabPanel}
    >
      {value === index && children}
    </div>
  );
};

const StartTask: React.FC = () => {
  const classes = useStyles();
  const [tasks, setTasks] = useState<AliceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<AliceTask | null>(null);
  const [taskResults, setTaskResults] = useState<TaskResponse[]>([]);
  const [selectedResult, setSelectedResult] = useState<TaskResponse | null>(null);
  const [inputValues, setInputValues] = useState<{ [key: string]: any }>({});
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isTaskResultDialogOpen, setIsTaskResultDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchTasks();
    fetchTaskResults();
  }, []);

  const fetchTasks = async () => {
    try {
      const fetchedTasks = await fetchItem('tasks');
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTaskResults = async () => {
    try {
      const fetchedResults = await fetchItem('taskresults');
      setTaskResults(fetchedResults);
    } catch (error) {
      console.error('Error fetching task results:', error);
    }
  };

  const handleSelectTask = (task: AliceTask) => {
    setSelectedTask(task);
    setInputValues({});
  };

  const handleCreateTask = () => {
    handleOpenTaskDialog();
  };

  const handleInputChange = (key: string, value: any) => {
    setInputValues({ ...inputValues, [key]: value });
  };

  const handleExecuteTask = async () => {
    if (!selectedTask || !selectedTask._id) return;

    try {
      console.log('Executing task:', selectedTask._id, inputValues);
      const result = await executeTask(selectedTask._id, inputValues);
      fetchTaskResults();
      setSelectedResult(result);
      handleOpenTaskResultDialog(result);
    } catch (error) {
      console.error('Error executing task:', error);
    }
  };

  const handleOpenTaskDialog = (taskId?: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setIsTaskDialogOpen(false);
    setSelectedTaskId(undefined);
  };

  const handleOpenTaskResultDialog = (result: TaskResponse) => {
    setSelectedResult(result);
    setIsTaskResultDialogOpen(true);
  };

  const handleCloseTaskResultDialog = () => {
    setIsTaskResultDialogOpen(false);
    setSelectedResult(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box className={classes.container}>
      <Box className={classes.mainContent}>
        <Box className={classes.tabsContainer}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="task tabs" centered>
            <Tab label="Execute Tasks" />
            <Tab label="Task Results" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={1}>
          <TaskResultTable taskResults={taskResults} setSelectedResult={handleOpenTaskResultDialog} />
        </TabPanel>

        <TabPanel value={activeTab} index={0}>
          <Box className={classes.executeTaskContainer}>
            <TaskSidebar
              tasks={tasks}
              onSelectTask={handleSelectTask}
              onCreateTask={handleCreateTask}
              selectedTask={selectedTask}
              viewTask={handleOpenTaskDialog}
            />
            <Box className={classes.taskExecuteContainer}>
              {selectedTask ? (
                <TaskExecute
                  selectedTask={selectedTask}
                  inputValues={inputValues}
                  handleInputChange={handleInputChange}
                  handleExecuteTask={handleExecuteTask}
                />
              ) : (
                <Card className={classes.disabledCard}>
                  <CardContent>
                    <Typography variant="h6" align="center">
                      Select a task to execute
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        </TabPanel>

        <Dialog open={isTaskDialogOpen} onClose={handleCloseTaskDialog} maxWidth="sm" fullWidth>
          <Task taskId={selectedTaskId} onClose={handleCloseTaskDialog} />
        </Dialog>
        <Dialog open={isTaskResultDialogOpen} onClose={handleCloseTaskResultDialog} fullWidth maxWidth="sm">
          {selectedResult && <TaskResult taskResponse={selectedResult} />}
        </Dialog>
      </Box>
    </Box>
  );
};

export default StartTask;