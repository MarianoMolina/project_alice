import { FileType, IFileReference, IFileReferenceDocument } from '../interfaces/file.interface';
import { ContentType, IMessageDocument, MessageGenerators, RoleType } from '../interfaces/message.interface';
import FileReference from '../models/file.model';
import Message from '../models/message.model';
import { updateMessage, messagesEqual } from './message.utils';
import Logger from './logger';
import { Types } from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import { getObjectId } from './utils';
import { processEmbeddings } from './embeddingChunk.utils';

const UPLOAD_DIR = process.env.SHARED_UPLOAD_DIR || '/app/shared-uploads';

Logger.info(`UPLOAD_DIR is set to: ${UPLOAD_DIR}`);

export function inferContentType(filename: string): FileType {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.txt':
        case '.md':
        case '.csv':
            return FileType.FILE;
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.bmp':
        case '.webp':
            return FileType.IMAGE;
        case '.mp3':
        case '.wav':
        case '.ogg':
        case '.flac':
            return FileType.AUDIO;
        case '.mp4':
        case '.avi':
        case '.mov':
        case '.wmv':
        case '.webm':
            return FileType.VIDEO;
        default:
            return FileType.FILE;
    }
}

async function ensureUserDirectory(userId: string): Promise<string> {
    const userDir = path.join(UPLOAD_DIR, userId);
    try {
        await fs.mkdir(userDir, { recursive: true });
        Logger.info(`User directory created: ${userDir}`);
    } catch (error) {
        Logger.error(`Error creating user directory: ${userDir}`, error);
        throw error;
    }
    return userDir;
}

export function getFileStorageName(filename: string, version?: string): string {
    if (version) {
        const filePureName = filename.split('.')[0];
        const ext = filename.split('.')[1];
        return `${filePureName}_v${version}.${ext}`;
    } else {
        return filename;
    }
}

export async function storeFile(userId: string, fileContent: string, filename: string, version?: number, fileId?: string): Promise<{
    filePath: string;
    fileId: string;
    bufferLength: number;
}> {
    const userDir = await ensureUserDirectory(userId);
    const fileIdUse = fileId ?? new Types.ObjectId().toString();
    const versionUse = fileId ? version : 0;
    const fileDir = path.join(userDir, fileIdUse);
    await fs.mkdir(fileDir);
    const storageFilename = getFileStorageName(filename, versionUse?.toString());

    const fileBuffer = Buffer.from(fileContent, 'base64');
    const filePath = path.join(fileDir, storageFilename);
    await fs.writeFile(filePath, fileBuffer);

    Logger.info(`File stored successfully: ${filePath}`);
    return {
        filePath,
        fileId: fileIdUse.toString(),
        bufferLength: fileBuffer.length
    };
}

export async function retrieveFileById(fileId: string, version?: number): Promise<{ file: Buffer; fileReference: IFileReferenceDocument }> {
    try {
        const fileReference = await FileReference.findById(fileId);
        if (!fileReference) {
            throw new Error('File not found');
        }
        fileReference.last_accessed = new Date();
        await fileReference.save();
        if (version == undefined) {
            Logger.debug(`Retrieving file version: ${version} from path: ${fileReference.storage_path}`);
            const file = await fs.readFile(fileReference.storage_path)
            Logger.debug(`File retrieved successfully: ${fileReference.storage_path}`);
            return { file, fileReference };
        } else {
            const filePath = fileReference.storage_path;
            const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'));
            const fileStorageName = getFileStorageName(fileReference.filename, version.toString());
            const storagePath = path.join(directoryPath, fileStorageName);
            Logger.debug(`Retrieving file: ${storagePath}`);
            const file = await fs.readFile(storagePath);
            Logger.debug(`File retrieved successfully: ${filePath}`);
            return { file, fileReference };
        }
    } catch (error) {
        Logger.error('Error retrieving file:', error);
        throw error;
    }
}

export async function deleteFile(fileId: string, userId: string): Promise<null> {
    try {
        const fileReference = await FileReference.findById(fileId);
        if (!fileReference) {
            throw new Error('File not found');
        }

        if (getObjectId(fileReference.created_by).toString() !== userId) {
            throw new Error('Unauthorized to delete this file');
        }

        const fileDir = path.dirname(fileReference.storage_path);

        // Delete all versions of the file
        try {
            const files = await fs.readdir(fileDir);
            await Promise.all(files.map(file => fs.unlink(path.join(fileDir, file))));
        } catch (error) {
            Logger.error('Error deleting file versions:', error);
        }

        // Delete the file directory
        try {
            await fs.rmdir(fileDir);
        } catch (error) {
            Logger.error('Error deleting file directory:', error);
        }

        // Delete the file reference from the database
        await FileReference.findByIdAndDelete(fileId);

        Logger.info(`File deleted successfully: ${fileReference.storage_path}`);
        return null;
    } catch (error) {
        Logger.error('Error deleting file:', error);
        throw error;
    }
}

export async function updateFileTranscript(
    fileId: string | Types.ObjectId,
    messageData: Partial<IMessageDocument>,
    userId: string
): Promise<IFileReferenceDocument> {
    const fileReference = await FileReference.findById(fileId);
    if (!fileReference) {
        throw new Error('File not found');
    }
    Logger.info(`Handling file transcript for file: ${fileId}`);

    let transcriptMessage: IMessageDocument;

    if (fileReference.transcript) {
        // Transcript exists, compare and update if necessary
        const existingTranscript = fileReference.transcript as IMessageDocument;
        if (!messagesEqual(existingTranscript, messageData)) {
            // Update the transcript message
            const updatedTranscript = await updateMessage(
                existingTranscript._id.toString(),
                messageData,
                userId
            );
            transcriptMessage = updatedTranscript!;
        } else {
            // No changes, use existing transcript
            transcriptMessage = existingTranscript;
        }
    } else {
        // No transcript, create a new one
        transcriptMessage = await createTranscriptMessage(messageData, userId);
    }

    try {
        await FileReference.updateOne(
            { _id: fileId },
            {
                $set: {
                    transcript: transcriptMessage._id,
                    updated_by: new Types.ObjectId(userId),
                    updatedAt: new Date(),
                },
            }
        );

        const updatedFileReference = await FileReference.findById(fileId);

        if (!updatedFileReference) {
            throw new Error('Failed to retrieve updated file reference');
        }

        return updatedFileReference;
    } catch (error) {
        Logger.error(`Error saving file transcript: ${error}`);
        throw error;
    }
}

export async function createTranscriptMessage(
    messageData: Partial<IMessageDocument>,
    userId: string
): Promise<IMessageDocument> {
    const transcriptData: Partial<IMessageDocument> = {
        ...messageData,
        content: messageData.content || '',
        role: messageData.role || RoleType.ASSISTANT,
        generated_by: messageData.generated_by || MessageGenerators.TOOL,
        type: messageData.type || ContentType.TEXT,
        created_by: new Types.ObjectId(userId),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const transcriptMessage = new Message(transcriptData);
    await transcriptMessage.save();
    return transcriptMessage;
}

export async function updateFile(
    fileId: string,
    updateData: Partial<IFileReferenceDocument>,
    userId: string
): Promise<IFileReferenceDocument> {
    Logger.info(`Inside updateFile, received data: ${JSON.stringify(updateData)}`);
    const existingFile = await FileReference.findById(fileId);
    if (!existingFile) {
        throw new Error('File not found');
    }

    if (getObjectId(existingFile.created_by).toString() !== userId.toString()) {
        Logger.error(`Unauthorized to update file: ${getObjectId(existingFile.created_by).toString()} userId: ${userId}`);
        throw new Error('Unauthorized to update this file');
    }

    let transcriptUpdated = false;
    if (updateData.transcript && 'content' in updateData.transcript && updateData.transcript.content) {
        Logger.info(`Updating file transcript for file: ${fileId}`);
        await updateFileTranscript(existingFile._id, updateData.transcript, userId);
        transcriptUpdated = true;
    }

    if (updateData.embedding) {
        updateData.embedding = await processEmbeddings(updateData, userId);
    }

    // Check if file reference needs updating
    const isEqual = fileReferencesEqual(existingFile, updateData);
    if (isEqual && !updateData.content && !transcriptUpdated) {
        Logger.info('No changes detected in file reference, returning existing file.');
        return existingFile;
    }

    // Proceed to update file reference
    if (updateData.content) {
        const version = existingFile.__v + 1;
        const { filePath, bufferLength } = await storeFile(
            userId,
            updateData.content,
            existingFile.filename,
            version,
            existingFile._id.toString()
        );
        existingFile.storage_path = filePath;
        existingFile.file_size = bufferLength;
    }

    if (updateData.type) {
        existingFile.type = updateData.type;
    }

    if (updateData.filename) {
        existingFile.filename = updateData.filename;
    }

    existingFile.updated_by = new Types.ObjectId(userId);
    existingFile.updatedAt = new Date();

    try {
        await existingFile.save();
    } catch (error) {
        Logger.error(`Error saving updated file: ${error}`);
        throw error;
    }

    // Re-fetch the updated file to ensure the latest data
    const updatedFile = await FileReference.findById(fileId);
    if (!updatedFile) {
        throw new Error('Failed to retrieve updated file reference');
    }

    return updatedFile;
}

export function fileReferencesEqual(
    fileRef1: IFileReferenceDocument,
    fileRef2: Partial<IFileReferenceDocument>
): boolean {
    // If content is present in fileRef2, an update is necessary
    if (fileRef2.content) {
        return false;
    }

    const keys: (keyof IFileReferenceDocument)[] = [
        'filename',
        'type',
        'file_size',
        'storage_path',
        'embedding'
    ];

    for (const key of keys) {
        if (fileRef2[key] !== undefined && fileRef1[key] !== fileRef2[key]) {
            return false;
        }
    }

    // Compare 'transcript'
    if (fileRef2.transcript) {
        if (!fileRef1.transcript) {
            // Existing file has no transcript, but new data has one
            return false;
        } else {
            // Both have transcripts, compare them
            if (
                !messagesEqual(
                    fileRef1.transcript as IMessageDocument,
                    fileRef2.transcript as Partial<IMessageDocument>
                )
            ) {
                return false;
            }
        }
    }

    return true;
}

export async function storeFileReference(
    fileContent: IFileReference,
    userId: string
): Promise<IFileReferenceDocument> {
    try {
        Logger.info(`Storing file for user: ${userId}`);
        if ('_id' in fileContent) {
            Logger.warn(`Removing _id from fileContent: ${fileContent._id}`);
            delete fileContent._id;
        }
        if (!fileContent.content) {
            Logger.error('File content is missing from fileContent', fileContent);
            throw new Error('File content is missing');
        }

        const { filePath, fileId, bufferLength } = await storeFile(
            userId,
            fileContent.content,
            fileContent.filename,
            0
        );
        if (fileContent.embedding) {
            fileContent.embedding = await processEmbeddings(fileContent, userId);
        }

        const fileReferenceData: Partial<IFileReferenceDocument> = {
            _id: new Types.ObjectId(fileId),
            filename: fileContent.filename,
            type: fileContent.type,
            file_size: bufferLength,
            storage_path: filePath,
            created_by: new Types.ObjectId(userId),
            updated_by: new Types.ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const fileReference = new FileReference(fileReferenceData);
        await fileReference.save();

        // Handle transcript if present
        if (fileContent.transcript && 'content' in fileContent.transcript && fileContent.transcript.content) {
            await updateFileTranscript(fileReference._id, fileContent.transcript, userId);
        }

        // Re-fetch the file reference to include the transcript
        const storedFileReference = await FileReference.findById(fileReference._id);
        if (!storedFileReference) {
            throw new Error('Failed to retrieve stored file reference');
        }

        return storedFileReference;
    } catch (error) {
        Logger.error('Error storing file:', error);
        throw error;
    }
}