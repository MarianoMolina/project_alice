import fs from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';
import FileReference from '../models/file.model';
import { FileType, IFileReferenceDocument, IFileReference } from '../interfaces/file.interface';
import { IMessageDocument } from '../interfaces/message.interface';
import Logger from './logger';

const UPLOAD_DIR = process.env.SHARED_UPLOAD_DIR || '/app/shared-uploads';

Logger.info(`UPLOAD_DIR is set to: ${UPLOAD_DIR}`);

export function inferContentType(filename: string): FileType {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.txt':
        case '.md':
        case '.csv':
            return FileType.TEXT;
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
        console.error(`Error creating user directory: ${userDir}`, error);
        throw error;
    }
    return userDir;
}

export async function updateFileTranscript(
    fileId: string | Types.ObjectId,
    message: Partial<IMessageDocument>,
    userId: string
): Promise<IFileReferenceDocument> {
    const fileReference = await FileReference.findById(fileId);
    if (!fileReference) {
        throw new Error('File not found');
    }
    Logger.info(`Handling file transcript for file: ${fileId} with data: ${JSON.stringify(message)}`);

    const transcript: IMessageDocument = createTranscriptMessage(message, userId);

    try {
        Logger.info(`Preparing to save file transcript: ${JSON.stringify(transcript)}`);
        Logger.info(`File reference before update: ${JSON.stringify(fileReference.toObject())}`);

        await FileReference.updateOne(
            { _id: fileId },
            { 
                $set: { 
                    transcript: transcript, 
                    updated_by: new Types.ObjectId(userId) 
                } 
            }
        );

        const updatedFileReference = await FileReference.findById(fileId);
        Logger.info(`File reference after update: ${JSON.stringify(updatedFileReference?.toObject())}`);

        if (!updatedFileReference) {
            throw new Error('Failed to retrieve updated file reference');
        }

        return updatedFileReference;
    } catch (error) {
        Logger.error(`Error saving file transcript: ${error}`);
        throw error;
    }
}

export function createTranscriptMessage(message: Partial<IMessageDocument>, userId: string): IMessageDocument {
    const transcript: IMessageDocument = {
        ...message,
        _id: new Types.ObjectId(),
        content: message.content || '',
        role: message.role || 'assistant',
        generated_by: message.generated_by || 'tool',
        type: message.type || 'text',
        created_by: new Types.ObjectId(userId),
        createdAt: new Date(),
        updatedAt: new Date()
    } as IMessageDocument;
    return transcript;
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
            return { file, fileReference};
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
        console.error('Error retrieving file:', error);
        throw error;
    }
}

export async function storeFileReference(fileContent: IFileReference, userId: string): Promise<IFileReferenceDocument> {
    try {
        if (!fileContent.content) {
            Logger.error('File content is missing from fileContent', fileContent);
            throw new Error('File content is missing');
        }
        const { filePath, fileId, bufferLength } = await storeFile(userId, fileContent.content, fileContent.filename, 0);

        const fileReference = new FileReference({
            _id: fileId,
            filename: fileContent.filename,
            type: fileContent.type,
            file_size: bufferLength,
            storage_path: filePath,
            created_by: new Types.ObjectId(userId),
            updated_by: new Types.ObjectId(userId),
        });

        await fileReference.save();

        if (fileContent.transcript && fileContent.transcript.content) {
            return await updateFileTranscript(fileReference._id, fileContent.transcript, userId);
        }

        return fileReference;
    } catch (error) {
        console.error('Error storing file:', error);
        throw error;
    }
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

    if (existingFile.created_by._id.toString() !== userId) {
        Logger.error(`Unauthorized to update file: ${fileId} userId: ${userId}`);
        throw new Error('Unauthorized to update this file');
    }

    if (updateData.content) {
        const version = existingFile.__v + 1
        const { filePath, fileId, bufferLength } = await storeFile(userId, updateData.content, existingFile.filename, version, existingFile._id.toString());
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

    try {
        Logger.info(`Updating file in util: ${fileId} with data: ${JSON.stringify(existingFile)}`);
        await existingFile.save();
    } catch (error) {
        Logger.error(`Error saving updated file: ${error}`);
        throw error;
    }

    if (updateData.transcript && updateData.transcript.content) {
        try {
            Logger.info(`Updating file transcript in util: ${fileId} with data: ${JSON.stringify(updateData.transcript)}`);
            return await updateFileTranscript(existingFile._id, updateData.transcript, userId);
        } catch (error) {
            Logger.error(`Error handling file transcript: ${error}`);
            throw error;
        }
    }

    return existingFile;
}

export async function deleteFile(fileId: string, userId: string): Promise<void> {
    try {
        const fileReference = await FileReference.findById(fileId);
        if (!fileReference) {
            throw new Error('File not found');
        }

        if (fileReference.created_by.toString() !== userId) {
            throw new Error('Unauthorized to delete this file');
        }

        const fileDir = path.dirname(fileReference.storage_path);

        // Delete all versions of the file
        try {
            const files = await fs.readdir(fileDir);
            await Promise.all(files.map(file => fs.unlink(path.join(fileDir, file))));
        } catch (error) {
            console.error('Error deleting file versions:', error);
        }

        // Delete the file directory
        try {
            await fs.rmdir(fileDir);
        } catch (error) {
            console.error('Error deleting file directory:', error);
        }

        // Delete the file reference from the database
        await FileReference.findByIdAndDelete(fileId);

        Logger.info(`File deleted successfully: ${fileReference.storage_path}`);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}
