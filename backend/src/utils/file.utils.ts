import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ContentType, IFileReferenceDocument } from '../interfaces/file.interface';
import FileReference from '../models/file.model';
import { Types } from 'mongoose';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/shared-uploads';
const FILE_BASE_URL = process.env.FILE_BASE_URL || 'http://localhost:3000/api/files/serve';

export function inferContentType(filename: string): ContentType {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.txt':
        case '.md':
        case '.csv':
            return ContentType.TEXT;
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.bmp':
        case '.webp':
            return ContentType.IMAGE;
        case '.mp3':
        case '.wav':
        case '.ogg':
        case '.flac':
            return ContentType.AUDIO;
        case '.mp4':
        case '.avi':
        case '.mov':
        case '.wmv':
        case '.webm':
            return ContentType.VIDEO;
        default:
            return ContentType.FILE;
    }
}

export async function storeFile(file: Express.Multer.File, userId: string, contentType?: ContentType): Promise<IFileReferenceDocument> {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    await fs.promises.writeFile(filePath, file.buffer);
    
    await fs.promises.chmod(filePath, 0o644); 

    const inferredContentType = contentType || inferContentType(file.originalname);
    const fileUrl = `${FILE_BASE_URL}/${fileId}`;

    const fileReference = new FileReference({
        _id: fileId,
        filename: file.originalname,
        type: inferredContentType,
        file_size: file.size,
        storage_path: filePath,
        file_url: fileUrl,
        created_by: new Types.ObjectId(userId)
    });

    await fileReference.save();
    return fileReference;
}

export async function retrieveFile(fileId: string): Promise<{ file: Buffer; fileReference: IFileReferenceDocument }> {
    const fileReference = await FileReference.findById(fileId);
    if (!fileReference) {
        throw new Error('File not found');
    }

    const file = await fs.promises.readFile(fileReference.storage_path);
    fileReference.last_accessed = new Date();
    await fileReference.save();

    return { file, fileReference };
}

export async function retrieveFileByName(fileName: string): Promise<{ file: Buffer; fileReference: IFileReferenceDocument }> {
    const fileReference = await FileReference.findOne({ filename: fileName });
    if (!fileReference) {
        throw new Error('File not found');
    }

    const file = await fs.promises.readFile(fileReference.storage_path);
    fileReference.last_accessed = new Date();
    await fileReference.save();

    return { file, fileReference };
}