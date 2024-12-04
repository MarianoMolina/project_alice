import React from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { CollectionName, CollectionType } from '../../../../types/CollectionTypes';
import { EditEntity } from './EditEntity';
import { DownloadEntity } from './DownloadEntity';
import { CopyButton } from '../../../ui/markdown/CopyButton';
import { DeleteEntity } from './DeleteEntity';

interface EntityActionsMenuProps<T extends CollectionName> {
  item: CollectionType[T];
  itemType: T;
  onDelete?: () => void;
  actions?: {
    edit?: boolean;
    download?: boolean;
    copy?: boolean;
    delete?: boolean;
  };
}

const EntityActionsMenu = <T extends CollectionName>({ 
  item, 
  itemType,
  onDelete,
  actions = {
    edit: true,
    download: true,
    copy: true,
    delete: true
  }
}: EntityActionsMenuProps<T>) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Don't render the menu if no actions are enabled
  const hasEnabledActions = Object.values(actions).some(value => value);
  if (!hasEnabledActions) return null;

  // Get JSON string for copy functionality
  const getEntityJson = () => {
    return JSON.stringify(item, null, 2);
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {actions.edit && itemType !== 'taskresults' && itemType !== 'userinteractions' && itemType !== 'embeddingchunks' && (
          <MenuItem>
            <EditEntity item={item} itemType={itemType} showLabel />
          </MenuItem>
        )}
        {actions.download && (
          <MenuItem>
            <DownloadEntity item={item} itemType={itemType} showLabel />
          </MenuItem>
        )}
        {actions.copy && (
          <MenuItem>
            <CopyButton code={getEntityJson()} showLabel />
          </MenuItem>
        )}
        {actions.delete && onDelete && (
          <MenuItem>
            <DeleteEntity itemType={itemType} handleDelete={onDelete} showLabel />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default EntityActionsMenu;