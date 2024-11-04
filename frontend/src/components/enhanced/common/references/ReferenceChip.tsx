import React from 'react';
import { Chip, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close, Visibility } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { MessageType } from '../../../../types/MessageTypes';
import { FileContentReference, FileReference } from '../../../../types/FileTypes';
import { TaskResponse } from '../../../../types/TaskResponseTypes';
import { URLReference } from '../../../../types/URLReferenceTypes';
import { UserInteraction } from '../../../../types/UserInteractionTypes';
import { EmbeddingChunk } from '../../../../types/EmbeddingChunkTypes';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import { CollectionElementString, CollectionTypeString } from '../../../../types/CollectionTypes';
import { ToolCall } from '../../../../types/ParameterTypes';
import ToolCallView from '../tool_call/ToolCall';
import UserInteractionViewer from '../../user_interaction/UserInteractionViewer';
import EmbeddingChunkViewer from '../../embedding_chunk/EmbeddingChunkViewer';

type ReferenceType = 
  | MessageType 
  | FileReference 
  | FileContentReference 
  | TaskResponse 
  | URLReference 
  | UserInteraction 
  | EmbeddingChunk 
  | ToolCall 
  | string;

type ReferenceTypeString = 
  | CollectionTypeString[keyof CollectionTypeString] 
  | 'string_output' 
  | 'tool_call' 
  | 'UserInteraction' 
  | 'EmbeddingChunk';

interface ReferenceChipProps {
  reference: ReferenceType;
  type: ReferenceTypeString;
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
  const { selectCardItem } = useCardDialog();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const getLabel = () => {
    switch (type) {
      case 'Message':
        return (reference as MessageType).content.substring(0, 20) + '...';
      
      case 'File':
        return (reference as FileReference | FileContentReference).filename;
      
      case 'TaskResponse':
        return `Task: ${(reference as TaskResponse).task_name}`;
      
      case 'URLReference':
        return (reference as URLReference).title;
      
      case 'UserInteraction':
        const interaction = reference as UserInteraction;
        return `Interaction: ${interaction.user_checkpoint_id.user_prompt.substring(0, 20)}...`;
      
      case 'EmbeddingChunk':
        const chunk = reference as EmbeddingChunk;
        return `Embedding ${chunk.index}: ${chunk.text_content.substring(0, 15)}...`;
      
      case 'string_output':
        return (reference as string).substring(0, 20) + '...';
      
      case 'tool_call':
        return `Tool: ${(reference as ToolCall).function.name}`;
      
      default:
        return 'Unknown Reference';
    }
  };

  const handleView = () => {
    if (['string_output', 'tool_call', 'UserInteraction', 'EmbeddingChunk'].includes(type)) {
      setDialogOpen(true);
    } else if (typeof reference === 'object' && '_id' in reference) {
      selectCardItem(type as CollectionElementString, reference._id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const renderDialogContent = () => {
    switch (type) {
      case 'string_output':
        return <ReactMarkdown>{reference as string}</ReactMarkdown>;
      
      case 'tool_call':
        return <ToolCallView toolCall={reference as ToolCall} />;
      
      case 'UserInteraction':
        return <UserInteractionViewer interaction={reference as UserInteraction} />;
      
      case 'EmbeddingChunk':
        return <EmbeddingChunkViewer chunk={reference as EmbeddingChunk} />;
      
      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'tool_call':
        return 'Tool Call';
      case 'UserInteraction':
        return 'User Interaction';
      case 'EmbeddingChunk':
        return 'Embedding Chunk';
      case 'string_output':
        return 'String Output';
      default:
        return 'Reference Details';
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
      
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
          {getDialogTitle()}
          <IconButton
            aria-label="close"
            onClick={() => setDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferenceChip;