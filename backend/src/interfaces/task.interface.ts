import { Document, Types } from 'mongoose';

export interface ITask {
    task_name: string;
    task_description: string;
    task_type: "CVGenerationTask" | "RedditSearchTask" | "APITask" | "WikipediaSearchTask" | "GoogleSearchTask" | "ExaSearchTask" | "ArxivSearchTask" | "BasicAgentTask" | "PromptAgentTask" | "CheckTask" | "CodeGenerationLLMTask" | "CodeExecutionLLMTask" | "AgentWithFunctions";
    input_variables: any | null;
    exit_codes: Map<string, string>;
    recursive: boolean;
    templates: Map<string, Types.ObjectId> | null;
    tasks: Map<string, Types.ObjectId> | null;
    valid_languages: string[];
    timeout: number | null;
    prompts_to_add: Map<string, Types.ObjectId> | null;
    exit_code_response_map: Map<string, number> | null;
    start_task: string | null;
    task_selection_method: any | null;
    tasks_end_code_routing: Map<string, Map<string, any>> | null;
    max_attempts: number;
    agent: Types.ObjectId | null;
    execution_agent: Types.ObjectId | null;
    human_input: boolean;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
}

export interface ITaskDocument extends ITask, Document {
    createdAt: Date;
    updatedAt: Date;
    apiRepresentation: () => any;
}