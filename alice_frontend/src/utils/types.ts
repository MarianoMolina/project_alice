export type RoleType = 'user' | 'assistant' | 'system';

export interface MessageType {
  role: RoleType;
  content: string;
  created_by: 'user' | 'llm';
  step: string;
  assistant_name: string;
  context: Record<string, any>;
}

export interface TaskResponseType {
  task_name: string;
  task_description: string;
  status: 'pending' | 'complete' | 'failed';
  result_code: number;
  task_outputs?: Record<string, any>;
  result_diagnostic?: string;
  task_content?: Record<string, any>;
  usage_metrics?: Record<string, any>;
}
