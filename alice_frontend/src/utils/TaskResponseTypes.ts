
export interface TaskResultProps {
    taskResponse: TaskResponse;
}

export interface TaskResponse {
    task_name: string;
    task_description: string;
    status: 'pending' | 'complete' | 'failed';
    result_code: number;
    task_outputs: string;
    task_content?: { [key: string]: any };
    result_diagnostic?: string;
    usage_metrics?: { [key: string]: any };
    execution_history?: { [key: string]: any }[];
    created_by?: string;
    updated_by?: string;
    createdAt?: string;
    updatedAt?: string;
    _id?: string;
}

export const convertToTaskResponse = (data: any): TaskResponse => {
    return {
        task_name: data?.task_name || '',
        task_description: data?.task_description || '',
        status: data?.status || 'pending',
        result_code: data?.result_code || 0,
        task_outputs: data?.task_outputs || {},
        result_diagnostic: data?.result_diagnostic || '',
        usage_metrics: data?.usage_metrics || {},
        execution_history: data?.execution_history || [],
        created_by: data?.created_by || '',
        updated_by: data?.updated_by || '',
        createdAt: data?.createdAt || '',
        updatedAt: data?.updatedAt || '',
        _id: data?._id || undefined,
    };
};

export interface TaskResponseComponentProps {
    items: TaskResponse[] | null;
    item: TaskResponse | null;
    mode: 'create' | 'view' | 'edit';
    onChange: (newItem: Partial<TaskResponse>) => void;
    handleSave: () => Promise<void>;
    onInteraction?: (taskResponse: TaskResponse) => void;
    isInteractable?: boolean;
    showHeaders?: boolean;
}