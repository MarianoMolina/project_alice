import { FileReference } from "../../../types/FileTypes";
import EnhancedFile from "../file/file/EnhancedFile";

interface FileOutputComponentProps {
    file: FileReference;
}

export const FileOutput: React.FC<FileOutputComponentProps> = ({ file }) => (
    <EnhancedFile mode={'card'} itemId={file._id} fetchAll={false} />
)