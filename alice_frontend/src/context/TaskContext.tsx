import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { TaskResponse } from '../utils/TaskResponseTypes';
import { useApi } from './ApiContext';
import { AliceTask } from '../utils/TaskTypes';

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
  createNewTask: (task: Partial<AliceTask>) => Promise<Partial<AliceTask> | undefined>;
  updateTask: (taskId: string, task: Partial<AliceTask>) => Promise<Partial<AliceTask> | undefined>;
  setSelectedTask: (task: AliceTask | null) => void;
  resetRecentExecutions: () => void;
  setTaskById: (taskId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { fetchItem, createItem, updateItem, executeTask } = useApi();
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
      console.error('Error fetching tasks:', error);
    }
  }, [fetchItem]);

  const fetchTaskResults = useCallback(async () => {
    try {
      console.log('Fetching task results');
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
      console.error('Error fetching task results:', error);
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
    console.log('Selected task in context:', task);
    setInputValues({});
    setExecutionStatus('idle');
  };

  const handleInputChange = (key: string, value: any) => {
    setInputValues({ ...inputValues, [key]: value });
  };

  const handleExecuteTask = async () => {
    if (!selectedTask || !selectedTask._id) return;
    try {
      console.log('Executing task:', selectedTask._id, inputValues);
      setExecutionStatus('progress');
      const result = await executeTask(selectedTask._id, inputValues);
      await fetchTaskResults(); // This will update recentExecutions
      console.log('Task execution result:', result);
      setSelectedResult(result);
      setExecutionStatus('success');
    } catch (error) {
      console.error('Error executing task:', error);
      setExecutionStatus('idle');
    }
  }

  const createNewTask = async (task: Partial<AliceTask>) => {
    try {
      if (!task._id) {
        return await createItem('tasks', task);
      } else {
        return await updateItem('tasks', task._id, task);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const updateTask = async (taskId: string, task: Partial<AliceTask>) => {
    try {
      return await updateItem('tasks', taskId, task);
    } catch (error) {
      console.error('Error updating task:', error);
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
    createNewTask,
    updateTask,
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