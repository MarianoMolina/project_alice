import { AudioFile, Chat, Computer, Groups, Image, InsertDriveFile, TaskAlt, VideoFile } from "@mui/icons-material";
import { FileType } from "../types/FileTypes";
import { ContentType } from "../types/MessageTypes";


export const getFileIcon = (type: FileType) => {
    switch (type) {
        case FileType.IMAGE:
            return <Image />;
        case FileType.AUDIO:
            return <AudioFile />;
        case FileType.VIDEO:
            return <VideoFile />;
        default:
            return <InsertDriveFile />;
    }
};

export const getMessageTypeIcon = (type?: ContentType) => {
    switch (type) {
        case ContentType.TEXT:
            return <Chat />;
        case ContentType.TASK_RESULT:
            return <TaskAlt />;
        case ContentType.MULTIPLE:
            return <Groups />;
        case ContentType.ENTITY_REFERENCE:
            return <Computer />;
        case ContentType.IMAGE:
            return getFileIcon(FileType.IMAGE);
        case ContentType.VIDEO:
            return getFileIcon(FileType.VIDEO);
        case ContentType.AUDIO:
            return getFileIcon(FileType.AUDIO);
        case ContentType.FILE:
            return getFileIcon(FileType.FILE);
        default:
            return <Chat />;
    }
};