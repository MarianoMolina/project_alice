import { HandleClickProps } from "./CollectionTypes";
import { References } from "./ReferenceTypes";
import { BaseDataseObject } from "./UserTypes";

export interface TaskResponse extends BaseDataseObject {
    _id?: string;
    task_name: string;
    task_id: string;
    task_description: string;
    status: 'pending' | 'complete' | 'failed';
    result_code: number;
    task_outputs?: string;
    references?: References;
    task_inputs?: { [key: string]: any };
    result_diagnostic?: string;
    usage_metrics?: { [key: string]: any };
    execution_history?: { [key: string]: any }[];
}

export const convertToTaskResponse = (data: any): TaskResponse => {
    return {
        task_name: data?.task_name || '',
        task_description: data?.task_description || '',
        task_id: data?.task_id || '',
        status: data?.status || 'pending',
        result_code: data?.result_code || 0,
        task_outputs: data?.task_outputs || {},
        references: data?.references || {},
        task_inputs: data?.task_inputs || {},
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

export interface TaskResponseComponentProps extends HandleClickProps {
    items: TaskResponse[] | null;
    item: TaskResponse | null;
    mode: 'create' | 'view' | 'edit';
    onChange: (newItem: Partial<TaskResponse>) => void;
    handleSave: () => Promise<void>;
    onInteraction?: (taskResponse: TaskResponse) => void;
    isInteractable?: boolean;
    onView?: (taskResponse: TaskResponse) => void;
    showHeaders?: boolean;
}