import { Types } from 'mongoose';
import { ICodeExecutionDocument } from '../interfaces/codeExecution.interface';
import CodeExecution from '../models/codeExecution.model';
import Logger from './logger';
import { processEmbeddings } from './embeddingChunk.utils';

// CodeExecution Utils
export async function createCodeExecution(
    codeExecutionData: Partial<ICodeExecutionDocument>,
    userId: string
): Promise<ICodeExecutionDocument | null> {
    try {
        Logger.debug('codeExecutionData received in createCodeExecution:', codeExecutionData);
        if ('_id' in codeExecutionData) {
            Logger.warn(`Removing _id from codeExecutionData: ${codeExecutionData._id}`);
            delete codeExecutionData._id;
        }

        
        if (codeExecutionData.embedding) {
            codeExecutionData.embedding = await processEmbeddings(codeExecutionData, userId);
        }
        // Set created_by and timestamps
        codeExecutionData.created_by = userId ? new Types.ObjectId(userId) : undefined;
        codeExecutionData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        codeExecutionData.createdAt = new Date();
        codeExecutionData.updatedAt = new Date();

        // Create and save the code execution
        const codeExecution = new CodeExecution(codeExecutionData);
        await codeExecution.save();
        return await CodeExecution.findById(codeExecution._id);
    } catch (error) {
        Logger.error('Error creating Code Execution:', error);
        return null;
    }
}

export async function updateCodeExecution(
    codeExecutionId: string,
    codeExecutionData: Partial<ICodeExecutionDocument>,
    userId: string
): Promise<ICodeExecutionDocument | null> {
    try {
        Logger.info('codeExecutionData received in updateCodeExecution:', codeExecutionData);
        const existingCodeExecution = await CodeExecution.findById(codeExecutionId);
        if (!existingCodeExecution) {
            throw new Error('Code execution not found');
        }

        // Compare the existing code execution with the new data
        const isEqual = codeExecutionsEqual(existingCodeExecution, codeExecutionData);
        if (isEqual) {
            return existingCodeExecution;
        }
        
        if (codeExecutionData.embedding) {
            codeExecutionData.embedding = await processEmbeddings(codeExecutionData, userId);
        }

        // Set updated_by and updatedAt
        codeExecutionData.updated_by = userId ? new Types.ObjectId(userId) : undefined;
        codeExecutionData.updatedAt = new Date();

        // Update the code execution
        const updatedCodeExecution = await CodeExecution.findByIdAndUpdate(
            codeExecutionId,
            codeExecutionData,
            { new: true, runValidators: true }
        );
        return updatedCodeExecution;
    } catch (error) {
        Logger.error('Error updating code execution:', error);
        return null;
    }
}

function codeExecutionsEqual(
    ce1: ICodeExecutionDocument,
    ce2: Partial<ICodeExecutionDocument>
): boolean {
    const keys: (keyof ICodeExecutionDocument)[] = [
        'code_block',
        'code_output',
        'created_by',
        'updated_by'
    ];
    for (const key of keys) {
        if (JSON.stringify(ce1[key]) !== JSON.stringify(ce2[key])) {
            return false;
        }
    }
    return true;
}