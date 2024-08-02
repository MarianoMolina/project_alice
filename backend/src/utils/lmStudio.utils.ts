import { LMStudioClient, LLMDynamicHandle } from "@lmstudio/sdk";
import Model from '../models/model.model';

export interface LoadedModel {
    model: LLMDynamicHandle;
    lastUsed: number;
}

export function getToolSystemMessages(tools: any[], tool_choice: string): Array<{ role: string, content: string }> {
    if (!tools || tools.length === 0 || tool_choice === 'none') {
        return [];
    }

    const systemMessage = {
        role: 'system',
        content: `You are a function calling AI model. You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Here are the available tools: <tools> ${JSON.stringify(tools)} </tools> Use the following pydantic model json schema for each tool call you will make: {"properties": {"arguments": {"title": "Arguments", "type": "object"}, "name": {"title": "Name", "type": "string"}}, "required": ["arguments", "name"], "title": "FunctionCall", "type": "object"} For each function call return a json object with function name and arguments within <tool_call></tool_call> XML tags as follows:
<tool_call>
{"arguments": <args-dict>, "name": <function-name>}
</tool_call>`
    };

    return [systemMessage];
}

export function mapStopReason(stopReason: string): string {
    switch (stopReason) {
        case 'eosFound':
            return 'stop';
        case 'maxTokensReached':
            return 'length';
        case 'functionCall':
            return 'function_call';
        case 'toolCalls':
            return 'tool_calls';
        default:
            return 'stop';
    }
}
// Function to unload all models
export async function unloadAllModels(client: LMStudioClient) {
    console.log("Unloading all previously loaded models...");
    try {
        const loadedModelsList = await client.llm.listLoaded();
        for (const model of loadedModelsList) {
            console.log(`Unloading model: ${model.identifier}`);
            await client.llm.unload(model.identifier);
        }
        console.log("All models unloaded successfully.");
    } catch (error) {
        console.error("Error unloading models:", error);
    }
}

// Helper function to unload inactive models
export function unloadInactiveModels(client: LMStudioClient, loadedModels: { [key: string]: LoadedModel }, INACTIVITY_THRESHOLD: number) {
    const now = Date.now();
    for (const [modelId, { model, lastUsed }] of Object.entries(loadedModels)) {
        if (now - lastUsed > INACTIVITY_THRESHOLD) {
            console.log(`Unloading inactive model: ${modelId}`);
            client.llm.unload(modelId);
            delete loadedModels[modelId];
        }
    }
}

export async function isModelAvailable(client: LMStudioClient, model_name: string) {
    const downloadedModels = await client.system.listDownloadedModels();
    console.log('Downloaded Models:', downloadedModels);
    const isModelAvailable = downloadedModels.some((model: any) => model.path.includes(model_name));
    return isModelAvailable
}

// Helper function to load a model
export async function loadModel(modelId: string, client: LMStudioClient, loadedModels: { [key: string]: LoadedModel })  {
    try {
        const modelInfo = await Model.findById(modelId);
        if (!modelInfo) {
            throw new Error(`Model with id ${modelId} not found in the database`);
        }
        const isModelAv = await isModelAvailable(client, modelInfo.model_name);

        if (!isModelAv) {
            throw new Error(`Model ${modelInfo.model_name} is not available in the system`);
        }
        
        console.log('Loading model with Info:', modelInfo);
        const model: LLMDynamicHandle = await client.llm.load(modelInfo.model_name, {
            config: {
                gpuOffload: "max",
                contextLength: modelInfo.ctx_size,
            },
            preset: process.env.LM_STUDIO_DEFAULT_PRESET || "OpenChat",
            noHup: true,
            verbose: true,
        });
        loadedModels[modelId] = { model, lastUsed: Date.now() };
        return model;
    } catch (error) {
        console.error(`Error loading model ${modelId}:`, error);
        throw new Error(`Failed to load model ${modelId}`);
    }
}

// Helper function to get or load a model
export async function getOrLoadModel(modelId: string, client: LMStudioClient, loadedModels: { [key: string]: LoadedModel }) {
    if (loadedModels[modelId]) {
        loadedModels[modelId].lastUsed = Date.now();
        return loadedModels[modelId].model;
    }
    return await loadModel(modelId, client, loadedModels);
}

// Utility function to check if content is a valid JSON object or array of objects
export function isValidJsonContent(content: string): boolean {
    try {
        const parsed = JSON.parse(content);
        return typeof parsed === 'object' && parsed !== null;
    } catch (error) {
        return false;
    }
}