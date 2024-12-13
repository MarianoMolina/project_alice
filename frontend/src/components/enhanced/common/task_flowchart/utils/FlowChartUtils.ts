import { AliceAgent } from "../../../../../types/AgentTypes";
import { ApiType } from "../../../../../types/ApiTypes";
import { FunctionParameters } from "../../../../../types/ParameterTypes";
import { Prompt } from "../../../../../types/PromptTypes";
import { AliceTask, PopulatedTask, RouteMap, TaskType } from "../../../../../types/TaskTypes";

export interface BaseTaskData {
  task_name: string;
  task_type: TaskType;
  agent?: AliceAgent | null;
  input_variables: FunctionParameters | null;
  exit_codes: { [key: string]: string };
  templates: { [key: string]: Prompt | null };
  required_apis?: ApiType[] | null;
  onSizeChange: (id: string, width: number, height: number) => void;
}

export interface TaskNodeData extends PopulatedTask, BaseTaskData {
}

export const getTaskByName = (
  parentTask: Partial<PopulatedTask>,
  taskName: string
): PopulatedTask | null => {
  return parentTask.tasks?.[taskName] || null;
};

export const getTaskRouteMap = (
  parentTask: Partial<PopulatedTask>,
  taskName: string
): RouteMap | null => {
  return parentTask.node_end_code_routing?.[taskName] || null;
};

// Create a type without onSizeChange for internal use
type SimpleTaskDataWithoutCallback = Omit<BaseTaskData, 'onSizeChange'>;

export const getNodeData = (
  parentTask: Partial<PopulatedTask>,
  taskName: string
): PopulatedTask | SimpleTaskDataWithoutCallback | null => {
  // First try to get the actual task object
  const taskData = getTaskByName(parentTask, taskName);
  if (taskData) {
    return taskData;
  }

  // If we can't find the task but have routing info for it,
  // return null as this is likely an inner node of a task
  const routeMap = getTaskRouteMap(parentTask, taskName);
  if (!routeMap) {
    return null;
  }

  // Create a simplified task data object for the workflow node
  return {
    task_name: taskName,
    input_variables: parentTask.input_variables || null,
    task_type: parentTask.task_type || TaskType.APITask,
    exit_codes: parentTask.exit_codes || {},
    required_apis: parentTask.required_apis || null,
    templates: parentTask.templates || {},
    agent: parentTask.agent || null,
  };
};

export const isFullTask = (
  data: AliceTask | SimpleTaskDataWithoutCallback | null
): data is AliceTask => {
  return data !== null && ('tasks' in data || 'task_description' in data);
};

export const hasRequiredTaskData = (task: Partial<AliceTask>): task is AliceTask => {
  return !!task.node_end_code_routing && 
         !!task.task_name && 
         typeof task.task_name === 'string';
};