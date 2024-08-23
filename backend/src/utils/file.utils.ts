import fs from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';
import FileReference from '../models/file.model';
import { FileContentReference, FileType, IFileReferenceDocument } from '../interfaces/file.interface';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'shared-uploads');
const FILE_BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000/api/files/serve';

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
    await fs.mkdir(userDir, { recursive: true });
    return userDir;
}

export async function storeFile(fileContent: FileContentReference, userId: string): Promise<IFileReferenceDocument> {
    const userDir = await ensureUserDirectory(userId);
    const fileId = new Types.ObjectId();
    const fileDir = path.join(userDir, fileId.toString());
    await fs.mkdir(fileDir);

    const fileBuffer = Buffer.from(fileContent.content, 'base64');
    const filePath = path.join(fileDir, fileContent.filename);
    await fs.writeFile(filePath, fileBuffer);

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
}

export async function updateFile(fileContent: FileContentReference, userId: string): Promise<IFileReferenceDocument> {
    if (!fileContent._id) {
        throw new Error('File ID is required for update');
    }

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

    existingFile.file_size = fileBuffer.length;
    existingFile.type = fileContent.type;
    await existingFile.save();

    return existingFile;
}

export async function retrieveFileById(fileId: string, version?: number): Promise<{ file: Buffer; fileReference: IFileReferenceDocument }> {
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

    return { file, fileReference };
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