import React from 'react';
import { Chip, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close, Visibility } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { MessageType } from '../../../../types/MessageTypes';
import { FileContentReference, FileReference } from '../../../../types/FileTypes';
import { TaskResponse } from '../../../../types/TaskResponseTypes';
import { URLReference } from '../../../../types/URLReferenceTypes';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import { CollectionElementString, CollectionTypeString } from '../../../../types/CollectionTypes';
import { ToolCall } from '../../../../types/ParameterTypes';
import ToolCallView from '../tool_call/ToolCall';

type ReferenceType = MessageType | FileReference | FileContentReference | TaskResponse | URLReference | string | ToolCall;

interface ReferenceChipProps {
  reference: ReferenceType;
  type: CollectionTypeString[keyof CollectionTypeString] | 'string_output' | 'tool_call';
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
      case 'string_output':
        return (reference as string).substring(0, 20) + '...';
      case 'tool_call':
        return `Tool: ${(reference as ToolCall).function.name}`;
      default:
        return 'Unknown';
    }
  };

  const handleView = () => {
    if (type === 'string_output' || type === 'tool_call') {
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
    if (type === 'string_output') {
      return <ReactMarkdown>{reference as string}</ReactMarkdown>;
    } else if (type === 'tool_call') {
      return <ToolCallView toolCall={reference as ToolCall} />;
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {type === 'tool_call' ? 'Tool Call' : 'String Output'}
          <IconButton
            aria-label="close"
            onClick={() => setDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferenceChip;