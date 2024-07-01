import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AliceTask, TaskResponse } from '../utils/types';
import { fetchItem, executeTask, createItem, updateItem } from '../services/api';

interface TaskContextType {
  tasks: AliceTask[];
  selectedTask: AliceTask | null;
  taskResults: TaskResponse[];
  selectedResult: TaskResponse | null;
  inputValues: { [key: string]: any };
  executionStatus: 'idle' | 'progress' | 'success';
  fetchTasks: () => Promise<void>;
  fetchTaskResults: () => Promise<void>;
  handleSelectTask: (task: AliceTask) => void;
  handleInputChange: (key: string, value: any) => void;
  handleExecuteTask: () => Promise<void>;
  setSelectedResult: (result: TaskResponse | null) => void;
  createNewTask: (task: Partial<AliceTask>) => Promise<Partial<AliceTask> | undefined>;
  updateTask: (taskId: string, task: Partial<AliceTask>) => Promise<Partial<AliceTask> | undefined>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<AliceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<AliceTask | null>(null);
  const [taskResults, setTaskResults] = useState<TaskResponse[]>([]);
  const [selectedResult, setSelectedResult] = useState<TaskResponse | null>(null);
  const [inputValues, setInputValues] = useState<{ [key: string]: any }>({});
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'progress' | 'success'>('idle');

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

  useEffect(() => {
    fetchTasks();
    fetchTaskResults();
  }, []);

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
      console.log('Executing task:', selectedTask._id, inputValues);
      setExecutionStatus('progress');
      const result = await executeTask(selectedTask._id, inputValues);
      await fetchTaskResults();
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
        task = await createItem('tasks', task);
      } else {
        task = await updateItem('tasks', task._id!, task);
      }
      return task;
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

  const value = {
    tasks,
    selectedTask,
    taskResults,
    selectedResult,
    inputValues,
    executionStatus,
    fetchTasks,
    fetchTaskResults,
    handleSelectTask,
    handleInputChange,
    handleExecuteTask,
    setSelectedResult,
    createNewTask,
    updateTask,
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