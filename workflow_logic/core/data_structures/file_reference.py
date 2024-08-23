import base64, io, magic, os
from typing import Union, BinaryIO, Optional
from pydantic import Field
from workflow_logic.core.data_structures.base_models import BaseDataStructure, FileType

class FileReference(BaseDataStructure):
    filename: str = Field(..., description="The name of the file reference")
    type: FileType = Field(..., description="The type of the file reference")
    storage_path: str = Field(..., description="The path to the file in the shared volume")

    class Config:
        populate_by_name = True

class FileContentReference(FileReference):
    storage_path: Optional[str] = Field(None, description="The path to the file in the shared volume")
    content: str = Field(..., description="The base64 encoded content of the file")

def generate_file_content_reference(file: Union[BinaryIO, io.BytesIO], filename: str) -> FileContentReference:
    # Ensure we're at the start of the file
    file.seek(0)
    
    # Read the first 2048 bytes for MIME type detection
    file_start = file.read(2048)
    file.seek(0)  # Reset file position

    # Use magic to get the MIME type
    mime = magic.Magic(mime=True)
    file_mime = mime.from_buffer(file_start)

    # Determine content type based on MIME type
    content_type = FileType.FILE
    if file_mime.startswith('text/'):
        content_type = FileType.TEXT
    elif file_mime.startswith('image/'):
        content_type = FileType.IMAGE
    elif file_mime.startswith('audio/'):
        content_type = FileType.AUDIO
    elif file_mime.startswith('video/'):
        content_type = FileType.VIDEO

    # Verify that the file extension matches the MIME type
    _, file_extension = os.path.splitext(filename)
    extension_mime_map = {
        '.txt': 'text/plain',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/x-wav',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo'
    }

    if file_extension.lower() in extension_mime_map:
        expected_mime = extension_mime_map[file_extension.lower()]
        if not file_mime.startswith(expected_mime):
            print(f"Warning: File extension '{file_extension}' does not match the detected MIME type '{file_mime}'")

    # Read and encode file content
    file_content = file.read()
    base64_content = base64.b64encode(file_content).decode('utf-8')

    # Create and return FileContentReference
    return FileContentReference(
        filename=filename,
        type=content_type,
        content=base64_content
    )
def get_file_content(file_reference: FileReference) -> str:
    """
    Helper method to get the content of a file from a FileReference or its subclasses.
    
    Args:
    file_reference (FileReference): The file reference object.
    
    Returns:
    str: The content of the file as a string.
    
    Raises:
    FileNotFoundError: If the file is not found at the storage_path.
    IOError: If there's an error reading the file.
    ValueError: If the file_reference is invalid or the content can't be decoded.
    """
    try:
        if isinstance(file_reference, FileContentReference) and file_reference.content:
            # If it's a FileContentReference with content, decode and return the content
            return base64.b64decode(file_reference.content).decode('utf-8')
        
        elif file_reference.storage_path:
            # For any FileReference (including FileContentReference without content), read from storage_path
            file_path = file_reference.storage_path
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found at {file_path}")
            
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        
        else:
            raise ValueError("Invalid FileReference: No content or valid storage_path provided")
    
    except FileNotFoundError as e:
        raise FileNotFoundError(f"File not found: {str(e)}")
    except IOError as e:
        raise IOError(f"Error reading file: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error processing FileReference: {str(e)}")