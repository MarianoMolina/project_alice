import { BaseDatabaseObject, convertToEmbeddable, convertToPopulatedEmbeddable, CostDict, Embeddable, EnhancedComponentProps, MessageCreationMetadata, PopulatedEmbeddable } from "./CollectionTypes";
import { DataCluster, PopulatedDataCluster, convertToDataCluster } from "./DataClusterTypes";

export interface ExecutionHistoryItem {
    parent_task_id?: string;
    node_name: string;
    execution_order: number;
    exit_code?: number;
}

export interface NodeResponse extends ExecutionHistoryItem {
    references: DataCluster;
}

export interface PopulatedNodeResponse extends Omit<NodeResponse, 'references'> {
    references: PopulatedDataCluster;
}

interface EntityMetadata {
    creation_metadata: Record<string, MessageCreationMetadata>;
}

export interface TaskUsageMetrics {
    messages?: MessageCreationMetadata[];
    files?: MessageCreationMetadata[];
    embeddings?: MessageCreationMetadata[];
    entity_references?: EntityMetadata[];
    task_responses?: TaskUsageMetrics[];
}

export interface TaskResponse extends BaseDatabaseObject, Embeddable {
    task_name: string;
    task_id: string;
    task_description: string;
    status: 'pending' | 'complete' | 'failed';
    result_code: number;
    task_outputs?: string;
    task_inputs?: { [key: string]: any };
    result_diagnostic?: string;
    usage_metrics?: TaskUsageMetrics & Record<string, any>;
    execution_history?: ExecutionHistoryItem[];
    node_references?: NodeResponse[];
}

export interface PopulatedTaskResponse extends Omit<TaskResponse, keyof Embeddable | 'node_references'>, PopulatedEmbeddable {
    node_references?: PopulatedNodeResponse[];
}

export const convertToTaskResponse = (data: any): TaskResponse => {
    return {
        ...convertToEmbeddable(data),
        task_name: data?.task_name || '',
        task_description: data?.task_description || '',
        task_id: data?.task_id || '',
        status: data?.status || 'pending',
        result_code: data?.result_code || 0,
        task_outputs: data?.task_outputs || {},
        task_inputs: data?.task_inputs || {},
        result_diagnostic: data?.result_diagnostic || '',
        usage_metrics: data?.usage_metrics || {},
        execution_history: data?.execution_history || [],
        node_references: data?.node_references || [],
    };
};

export const convertToPopulatedTaskResponse = (data: any): PopulatedTaskResponse => {
    return {
        ...convertToPopulatedEmbeddable(data),
        task_name: data?.task_name || '',
        task_description: data?.task_description || '',
        task_id: data?.task_id || '',
        status: data?.status || 'pending',
        result_code: data?.result_code || 0,
        task_outputs: data?.task_outputs || {},
        task_inputs: data?.task_inputs || {},
        result_diagnostic: data?.result_diagnostic || '',
        usage_metrics: data?.usage_metrics || {},
        execution_history: data?.execution_history || [],
        node_references: data?.node_references ? data.node_references.map((node: any) => ({
                ...node,
                references: convertToDataCluster(node.references),
            })
        ) : [],
    };
}

export interface TaskResponseComponentProps extends EnhancedComponentProps<TaskResponse | PopulatedTaskResponse> {

}

export const aggregateTaskMetadata = (usageMetrics: TaskUsageMetrics): MessageCreationMetadata => {
    const result: MessageCreationMetadata = {
        usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
        },
        cost: {
            input_cost: 0,
            output_cost: 0,
            total_cost: 0
        },
        estimated_tokens: 0,
        model: "Multiple",
        generation_details: {}
    };

    const models = new Set<string>();

    // Helper function to safely add costs
    const addCosts = (metadata: MessageCreationMetadata) => {
        if (!metadata.cost) return;

        if (metadata.cost.input_cost) {
            result.cost!.input_cost = (result.cost!.input_cost || 0) + metadata.cost.input_cost;
        }
        if (metadata.cost.output_cost) {
            result.cost!.output_cost = (result.cost!.output_cost || 0) + metadata.cost.output_cost;
        }
        if (metadata.cost.total_cost) {
            result.cost!.total_cost = (result.cost!.total_cost || 0) + metadata.cost.total_cost;
        }
    };

    // Helper function to safely add usage and estimated tokens
    const addUsage = (metadata: MessageCreationMetadata) => {
        if (!metadata.usage) return;

        if (metadata.usage.prompt_tokens) {
            result.usage!.prompt_tokens = (result.usage!.prompt_tokens || 0) + metadata.usage.prompt_tokens;
        }
        if (metadata.usage.completion_tokens) {
            result.usage!.completion_tokens = (result.usage!.completion_tokens || 0) + metadata.usage.completion_tokens;
        }
        if (metadata.usage.total_tokens) {
            result.usage!.total_tokens = (result.usage!.total_tokens || 0) + metadata.usage.total_tokens;
        }
        
        // Add estimated tokens
        if (metadata.estimated_tokens) {
            result.estimated_tokens = (result.estimated_tokens || 0) + metadata.estimated_tokens;
        }
    };

    // Helper function to process a single message metadata
    const processMessageMetadata = (metadata: MessageCreationMetadata) => {
        if (!metadata) return;
        addCosts(metadata);
        addUsage(metadata);
        if (metadata.model) {
            models.add(metadata.model);
        }
    };

    // Process direct metadata sources
    ['messages', 'files', 'embeddings'].forEach((key) => {
        const metadataList = usageMetrics[key as keyof TaskUsageMetrics] as MessageCreationMetadata[] | undefined;
        if (!metadataList) return;
        
        metadataList.forEach(processMessageMetadata);
    });

    // Process entity references
    if (usageMetrics.entity_references) {
        usageMetrics.entity_references.forEach(entityRef => {
            if (!entityRef.creation_metadata) return;

            Object.values(entityRef.creation_metadata).forEach(processMessageMetadata);
        });
    }

    // Recursively process task responses
    if (usageMetrics.task_responses) {
        usageMetrics.task_responses.forEach(taskResponse => {
            const nestedMetadata = aggregateTaskMetadata(taskResponse);
            
            // Add nested metadata to our totals
            if (nestedMetadata.cost) {
                addCosts(nestedMetadata);
            }
            if (nestedMetadata.usage) {
                addUsage(nestedMetadata);
            }
            if (nestedMetadata.model) {
                models.add(nestedMetadata.model);
            }
        });
    }

    // Update model field based on what we found
    if (models.size === 1) {
        result.model = Array.from(models)[0];
    } else if (models.size > 1) {
        result.model = `Multiple (${models.size})`;
        result.generation_details!.models = Array.from(models);
    }

    // Round all costs to 6 decimal places for consistency
    if (result.cost) {
        const costKeys: (keyof CostDict)[] = ['input_cost', 'output_cost', 'total_cost'];
        costKeys.forEach(key => {
            if (result.cost![key] !== undefined) {
                result.cost![key] = Number(result.cost![key]!.toFixed(6));
            }
        });
    }

    return result;
};