import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { PopulatedTaskResponse, TaskResponse } from '../types/TaskResponseTypes';
import { useApi } from './ApiContext';
import { AliceTask, PopulatedTask } from '../types/TaskTypes';
import { useNotification } from './NotificationContext';
import Logger from '../utils/Logger';
import { fetchPopulatedItem } from '../services/api';
import { useCardDialog } from './CardDialogContext';

export interface RecentExecution {
  taskId: string;
  inputs: { [key: string]: any };
  result: TaskResponse | PopulatedTaskResponse;
  timestamp: Date;
}

interface TaskContextType {
  tasks: AliceTask[] | PopulatedTask[];
  selectedTask: PopulatedTask | null;
  taskResults: (TaskResponse | PopulatedTaskResponse)[];
  inputValues: { [key: string]: any };
  executionStatus: 'idle' | 'progress' | 'success';
  selectionStatus: 'idle' | 'loading' | 'success' | 'error';
  recentExecutions: RecentExecution[];
  fetchTasks: () => Promise<void>;
  fetchTaskResults: () => Promise<void>;
  handleSelectTask: (task: AliceTask | PopulatedTask) => Promise<void>;
  handleInputChange: (key: string, value: any) => void;
  setInputValues: (values: { [key: string]: any }) => void;
  handleExecuteTask: () => Promise<void>;
  setSelectedTask: (task: PopulatedTask | null) => void;
  resetRecentExecutions: () => void;
  setTaskById: (taskId: string) => Promise<void>;
  getTaskResultsById: (taskId: string) => TaskResponse[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotification();
  const { selectCardItem } = useCardDialog();
  const { fetchItem, executeTask } = useApi();
  const [tasks, setTasks] = useState<AliceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<PopulatedTask | null>(null);
  const [taskResults, setTaskResults] = useState<(TaskResponse | PopulatedTaskResponse)[]>([]);
  const [inputValues, setInputValues] = useState<{ [key: string]: any }>({});
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'progress' | 'success'>('idle');
  const [selectionStatus, setSelectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
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

  const setTaskById = async (taskId: string) => {
    setSelectionStatus('loading');
    try {
      const task = await fetchPopulatedItem('tasks', taskId);
      if (task) {
        setSelectedTask(task as PopulatedTask);
        setSelectionStatus('success');
      } else {
        setSelectionStatus('error');
        Logger.error('Task not found:', taskId);
      }
    } catch (error) {
      setSelectionStatus('error');
      Logger.error('Error fetching task:', error);
    }
  };

  const handleSelectTask = async (task: AliceTask | PopulatedTask) => {
    if (!task._id) {
      setSelectionStatus('error');
      return;
    }

    try {
      await setTaskById(task._id);
      setInputValues({});
      setExecutionStatus('idle');
    } catch (error) {
      setSelectionStatus('error');
      Logger.error('Error selecting task:', error);
    }
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
      
      // Create updated results array
      const updatedResults = [...taskResults, result as TaskResponse];
      setTaskResults(updatedResults);
      
      // Sort and update recent executions using the updated results
      const sortedResults = updatedResults
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
      
      Logger.debug('Task executed successfully:', result);
      addNotification('Task executed successfully', 'success', 5000, {
        label: 'View Result',
        onClick: () => selectCardItem('TaskResponse', result._id as string)
      });
      setExecutionStatus('success');
    } catch (error) {
      Logger.error('Error executing task:', error);
      addNotification('Error executing task', 'error');
      setExecutionStatus('idle');
    }
  };

  const resetRecentExecutions = () => {
    setRecentExecutions([]);
  };

  const getTaskResultsById = (taskId: string): TaskResponse[] => {
    return taskResults.filter(result => result.task_id === taskId)as TaskResponse[];
  };

  const value: TaskContextType = {
    tasks,
    selectedTask,
    taskResults,
    inputValues,
    executionStatus,
    selectionStatus,
    recentExecutions,
    fetchTasks,
    fetchTaskResults,
    handleSelectTask,
    handleInputChange,
    setInputValues,
    handleExecuteTask,
    setSelectedTask,
    resetRecentExecutions,
    setTaskById,
    getTaskResultsById
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