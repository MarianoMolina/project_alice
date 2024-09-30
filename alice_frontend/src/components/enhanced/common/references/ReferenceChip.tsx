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

type ReferenceType = MessageType | FileReference | FileContentReference | TaskResponse | URLReference | string;

interface ReferencesChipProps {
  reference: ReferenceType;
  type: CollectionTypeString[keyof CollectionTypeString] | 'string_output';
  view?: boolean;
  className?: string;
  delete?: boolean;
  onDelete?: () => void;
}

const ReferencesChip: React.FC<ReferencesChipProps> = ({ 
  reference, 
  type, 
  view = false, 
  className, 
  delete: deleteOption = false, 
  onDelete 
}) => {
  const { selectItem } = useCardDialog();
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
      default:
        return 'Unknown';
    }
  };

  const handleView = () => {
    if (type === 'string_output') {
      setDialogOpen(true);
    } else if (typeof reference === 'object' && '_id' in reference) {
      selectItem(type as CollectionElementString, reference._id);
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
      {type === 'string_output' && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>
            String Output
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
            <ReactMarkdown>{reference as string}</ReactMarkdown>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ReferencesChip;