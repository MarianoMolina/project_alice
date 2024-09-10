import fs from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';
import FileReference from '../models/file.model';
import { FileContentReference, FileType, IFileReferenceDocument } from '../interfaces/file.interface';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/shared-uploads';
const FILE_BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000/api/files/serve';

console.log(`UPLOAD_DIR is set to: ${UPLOAD_DIR}`);

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
        console.log(`User directory created: ${userDir}`);
    } catch (error) {
        console.error(`Error creating user directory: ${userDir}`, error);
        throw error;
    }
    return userDir;
}

export async function storeFile(fileContent: FileContentReference, userId: string): Promise<IFileReferenceDocument> {
    try {
        const userDir = await ensureUserDirectory(userId);
        const fileId = new Types.ObjectId();
        const fileDir = path.join(userDir, fileId.toString());
        await fs.mkdir(fileDir);

        const fileBuffer = Buffer.from(fileContent.content, 'base64');
        const filePath = path.join(fileDir, fileContent.filename);
        await fs.writeFile(filePath, fileBuffer);

        console.log(`File stored successfully: ${filePath}`);

        const fileReference = new FileReference({
            _id: fileId,
            filename: fileContent.filename,
            type: fileContent.type,
            file_size: fileBuffer.length,
            storage_path: filePath,
            created_by: new Types.ObjectId(userId)
        });

        await fileReference.save();
        return fileReference;
    } catch (error) {
        console.error('Error storing file:', error);
        throw error;
    }
}

export async function updateFile(fileContent: FileContentReference, userId: string): Promise<IFileReferenceDocument> {
    if (!fileContent._id) {
        throw new Error('File ID is required for update');
    }

    try {
        const existingFile = await FileReference.findById(fileContent._id);
        if (!existingFile) {
            throw new Error('File not found');
        }

        if (existingFile.created_by.toString() !== userId) {
            throw new Error('Unauthorized to update this file');
        }

        const fileDir = path.dirname(existingFile.storage_path);
        const versionFiles = await fs.readdir(fileDir);
        const versionNumber = versionFiles.length;

        const newVersionFilename = `${path.parse(fileContent.filename).name}_v${versionNumber}${path.parse(fileContent.filename).ext}`;
        const newVersionPath = path.join(fileDir, newVersionFilename);

        const fileBuffer = Buffer.from(fileContent.content, 'base64');
        await fs.writeFile(newVersionPath, fileBuffer);

        // Update the default file
        await fs.writeFile(existingFile.storage_path, fileBuffer);

        console.log(`File updated successfully: ${existingFile.storage_path}`);

        existingFile.file_size = fileBuffer.length;
        existingFile.type = fileContent.type;
        await existingFile.save();

        return existingFile;
    } catch (error) {
        console.error('Error updating file:', error);
        throw error;
    }
}

export async function retrieveFileById(fileId: string, version?: number): Promise<{ file: Buffer; fileReference: IFileReferenceDocument }> {
    try {
        const fileReference = await FileReference.findById(fileId);
        if (!fileReference) {
            throw new Error('File not found');
        }

        let filePath = fileReference.storage_path;
        if (version !== undefined) {
            const fileDir = path.dirname(filePath);
            const versionFilename = `${path.parse(fileReference.filename).name}_v${version}${path.parse(fileReference.filename).ext}`;
            filePath = path.join(fileDir, versionFilename);
        }

        const file = await fs.readFile(filePath);
        fileReference.last_accessed = new Date();
        await fileReference.save();

        console.log(`File retrieved successfully: ${filePath}`);

        return { file, fileReference };
    } catch (error) {
        console.error('Error retrieving file:', error);
        throw error;
    }
}

export async function processMessageReferences(message: any, userId: string): Promise<any> {
    if (message.references && Array.isArray(message.references)) {
        const processedReferences = await Promise.all(message.references.map(async (ref: any) => {
            if (ref.content) { // This is a FileContentReference
                if (ref._id) {
                    return await updateFile(ref, userId);
                } else {
                    return await storeFile(ref, userId);
                }
            }
            return ref; // This is already a FileReference
        }));
        message.references = processedReferences.map(ref => ref._id);
    }
    return message;
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

        console.log(`File deleted successfully: ${fileReference.storage_path}`);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}
