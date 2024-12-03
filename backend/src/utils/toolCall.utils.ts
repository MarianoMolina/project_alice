import { Types } from 'mongoose';
import { IToolCallDocument } from '../interfaces/toolCall.interface';
import ToolCall from '../models/toolCall.model';
import Logger from './logger';
import { processEmbeddings } from './embeddingChunk.utils';

export async function createToolCall(
    toolCallData: Partial<IToolCallDocument>,
    userId: string
): Promise<IToolCallDocument | null> {
    try {
        Logger.debug('toolCallData received in createToolCall:', toolCallData);
        if ('_id' in toolCallData) {
            Logger.warn(`Removing _id from toolCallData: ${toolCallData._id}`);
            delete toolCallData._id;
        }
        
        if (toolCallData.embedding) {
            toolCallData.embedding = await processEmbeddings(toolCallData, userId);
        }

        // Set created_by and timestamps
        toolCallData.created_by = userId ? new Types.ObjectId(userId) : undefined;
        toolCallData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        toolCallData.createdAt = new Date();
        toolCallData.updatedAt = new Date();

        // Create and save the tool call
        const toolCall = new ToolCall(toolCallData);
        await toolCall.save();
        return await ToolCall.findById(toolCall._id);
    } catch (error) {
        Logger.error('Error creating Tool Call:', error);
        return null;
    }
}

export async function updateToolCall(
    toolCallId: string,
    toolCallData: Partial<IToolCallDocument>,
    userId: string
): Promise<IToolCallDocument | null> {
    try {
        Logger.info('toolCallData received in updateToolCall:', toolCallData);
        const existingToolCall = await ToolCall.findById(toolCallId);
        if (!existingToolCall) {
            throw new Error('Tool call not found');
        }

        // Compare the existing tool call with the new data
        const isEqual = toolCallsEqual(existingToolCall, toolCallData);
        if (isEqual) {
            return existingToolCall;
        }
        
        if (toolCallData.embedding) {
            toolCallData.embedding = await processEmbeddings(toolCallData, userId);
        }

        // Set updated_by and updatedAt
        toolCallData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        toolCallData.updatedAt = new Date();

        // Update the tool call
        const updatedToolCall = await ToolCall.findByIdAndUpdate(
            toolCallId,
            toolCallData,
            { new: true, runValidators: true }
        );
        return updatedToolCall;
    } catch (error) {
        Logger.error('Error updating tool call:', error);
        return null;
    }
}

function toolCallsEqual(
    tc1: IToolCallDocument,
    tc2: Partial<IToolCallDocument>
): boolean {
    const keys: (keyof IToolCallDocument)[] = [
        'type',
        'function',
        'created_by',
        'updated_by',
        'embedding'
    ];
    for (const key of keys) {
        if (JSON.stringify(tc1[key]) !== JSON.stringify(tc2[key])) {
            return false;
        }
    }
    return true;
}