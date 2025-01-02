import React from 'react';
import { Chip } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { MessageType } from '../../../types/MessageTypes';
import { FileContentReference, FileReference } from '../../../types/FileTypes';
import { TaskResponse } from '../../../types/TaskResponseTypes';
import { EntityReference } from '../../../types/EntityReferenceTypes';
import { UserInteraction } from '../../../types/UserInteractionTypes';
import { EmbeddingChunk } from '../../../types/EmbeddingChunkTypes';
import { useDialog } from '../../../contexts/DialogContext';
import { CollectionElementString } from '../../../types/CollectionTypes';
import { ReferenceType } from '../../../types/ReferenceTypes';
import { ToolCall } from '../../../types/ToolCallTypes';
import { CodeExecution } from '../../../types/CodeExecutionTypes';

interface ReferenceChipProps {
  reference: ReferenceType;
  type: CollectionElementString; //CollectionTypeString[keyof CollectionTypeString]
  view?: boolean;
  className?: string;
  delete?: boolean;
  onDelete?: () => void;
}

const ReferenceChip: React.FC<ReferenceChipProps> = ({
  reference,
  type,
  view = false,
  className,
  delete: deleteOption = false,
  onDelete
}) => {
  const { selectCardItem } = useDialog();

  const getLabel = () => {
    switch (type) {
      case 'Message':
        return (reference as MessageType).content?.substring(0, 20) + '...';
      
      case 'File':
        return (reference as FileReference | FileContentReference).filename;
      
      case 'TaskResponse':
        return `Task: ${(reference as TaskResponse).task_name}`;
      
      case 'EntityReference':
        return (reference as EntityReference).name ?? 'Entity Reference';
      
      case 'UserInteraction':
        const interaction = reference as UserInteraction;
        return `Interaction: ${interaction.user_checkpoint_id.user_prompt.substring(0, 20)}...`;
      
      case 'EmbeddingChunk':
        const chunk = reference as EmbeddingChunk;
        return `Embedding ${chunk.index}: ${chunk.text_content.substring(0, 15)}...`;
      
      case 'CodeExecution':
        return `Code Execution: ${(reference as CodeExecution).code_block.code.substring(0, 20)}...`;
      
      case 'ToolCall':
        return `Tool: ${(reference as ToolCall).function.name}`;
      
      default:
        return 'Unknown Reference';
    }
  };

  const handleView = () => {
    if (typeof reference === 'object' && '_id' in reference) {
      selectCardItem(type as CollectionElementString, reference._id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <>
      <Chip
        label={getLabel()}
        className={className}
        onDelete={deleteOption && onDelete ? handleDelete : undefined}
        onClick={view ? handleView : undefined}
        icon={view ? <Visibility /> : undefined}
      />
    </>
  );
};

export default ReferenceChip;