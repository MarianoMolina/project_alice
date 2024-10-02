import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { TaskResponse } from '../types/TaskResponseTypes';
import { useApi } from './ApiContext';
import { AliceTask } from '../types/TaskTypes';
import { useNotification } from './NotificationContext';
import Logger from '../utils/Logger';

export interface RecentExecution {
  taskId: string;
  inputs: { [key: string]: any };
  result: TaskResponse;
  timestamp: Date;
}

interface TaskContextType {
  tasks: AliceTask[];
  selectedTask: AliceTask | null;
  taskResults: TaskResponse[];
  selectedResult: TaskResponse | null;
  inputValues: { [key: string]: any };
  executionStatus: 'idle' | 'progress' | 'success';
  recentExecutions: RecentExecution[];
  fetchTasks: () => Promise<void>;
  fetchTaskResults: () => Promise<void>;
  handleSelectTask: (task: AliceTask) => void;
  handleInputChange: (key: string, value: any) => void;
  setInputValues: (values: { [key: string]: any }) => void;
  handleExecuteTask: () => Promise<void>;
  setSelectedResult: (result: TaskResponse | null) => void;
  setSelectedTask: (task: AliceTask | null) => void;
  resetRecentExecutions: () => void;
  setTaskById: (taskId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotification();
  const { fetchItem, executeTask } = useApi();
  const [tasks, setTasks] = useState<AliceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<AliceTask | null>(null);
  const [taskResults, setTaskResults] = useState<TaskResponse[]>([]);
  const [selectedResult, setSelectedResult] = useState<TaskResponse | null>(null);
  const [inputValues, setInputValues] = useState<{ [key: string]: any }>({});
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'progress' | 'success'>('idle');
  const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      const fetchedTasks = await fetchItem('tasks');
      setTasks(fetchedTasks as AliceTask[]);
    } catch (error) {
      Logger.error('Error fetching tasks:', error);
    }
  }, [fetchItem]);

  const fetchTaskResults = useCallback(async () => {
    try {
      const fetchedResults = await fetchItem('taskresults');
      setTaskResults(fetchedResults as TaskResponse[]);
     
      // Initialize recentExecutions with the latest 10 task results
      const sortedResults = (fetchedResults as TaskResponse[])
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
  
      const latestExecutions = sortedResults.slice(0, 10).map(result => ({
        taskId: result.task_id,
        inputs: result.task_inputs || {},
        result: result,
        timestamp: new Date(result.createdAt || new Date())
      }));
      setRecentExecutions(latestExecutions);
    } catch (error) {
      Logger.error('Error fetching task results:', error);
    }
  }, [fetchItem]);

  useEffect(() => {
    fetchTasks();
    fetchTaskResults();
  }, [fetchTasks, fetchTaskResults]);

  const setTaskById = (taskId: string) => {
    const task = tasks.find(task => task._id === taskId);
    if (task) {
      setSelectedTask(task);
    }
  };

  const handleSelectTask = (task: AliceTask) => {
    setSelectedTask(task);
    setInputValues({});
    setExecutionStatus('idle');
  };

  const handleInputChange = (key: string, value: any) => {
    setInputValues({ ...inputValues, [key]: value });
  };

  const handleExecuteTask = async () => {
    if (!selectedTask || !selectedTask._id) return;
    try {
      Logger.debug('Executing task:', selectedTask._id, inputValues);
      setExecutionStatus('progress');
      const result = await executeTask(selectedTask._id, inputValues);
      await fetchTaskResults(); 
      addNotification('Task executed successfully', 'success');
      setSelectedResult(result);
      setExecutionStatus('success');
    } catch (error) {
      Logger.error('Error executing task:', error);
      addNotification('Error executing task', 'error');
      setExecutionStatus('idle');
    }
  }

  const resetRecentExecutions = () => {
    setRecentExecutions([]);
  };

  const value: TaskContextType = {
    tasks,
    selectedTask,
    taskResults,
    selectedResult,
    inputValues,
    executionStatus,
    recentExecutions,
    fetchTasks,
    fetchTaskResults,
    handleSelectTask,
    handleInputChange,
    setInputValues,
    handleExecuteTask,
    setSelectedResult, 
    setSelectedTask,
    resetRecentExecutions,
    setTaskById,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};