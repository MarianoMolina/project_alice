import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { Person, Edit, Warning } from '@mui/icons-material';
import { ApiName } from '../../../../types/ApiTypes';
import { User } from '../../../../types/UserTypes';
import { UserDetail } from './UserDetail';

interface UserListViewProps {
  users: User[];
  hasUnsavedChanges: boolean;
  disabledApis: Set<ApiName>;
  onUpdateUserApis: (userId: string, enabledApis: ApiName[]) => Promise<void>;
  isUpdating: boolean;
}

export const UserListView: React.FC<UserListViewProps> = ({
  users,
  hasUnsavedChanges,
  disabledApis,
  onUpdateUserApis,
  isUpdating,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<User | null>(null);

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleUpdateClick = (user: User) => {
    if (hasUnsavedChanges) {
      setUserToUpdate(user);
      setShowUpdateConfirm(true);
    } else {
      handleUpdateUser(user);
    }
  };

  const handleUpdateUser = async (user: User) => {
    const enabledApis = Object.values(ApiName).filter(api => !disabledApis.has(api));
    if (!user._id) {
      console.error('User ID is undefined');
      return;
    }
    await onUpdateUserApis(user._id, enabledApis);
  };

  const handleConfirmUpdate = () => {
    if (userToUpdate) {
      handleUpdateUser(userToUpdate);
      setShowUpdateConfirm(false);
      setUserToUpdate(null);
    }
  };

  return (
    <>
      <List>
        {users.map((user) => (
          <ListItem key={user._id}>
            <ListItemText
              primary={user.email}
              secondary={user.role}
            />
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                onClick={() => handleViewUser(user)}
                disabled={isUpdating}
              >
                <Person />
              </IconButton>
              <IconButton 
                edge="end" 
                onClick={() => handleUpdateClick(user)}
                disabled={isUpdating}
              >
                <Edit />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {selectedUser && (
        <UserDetail
          user={selectedUser}
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <Dialog open={showUpdateConfirm} onClose={() => setShowUpdateConfirm(false)}>
        <DialogTitle>
          <Warning color="warning" /> Unsaved Changes
        </DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes in the API configuration. If you proceed,
            these changes will not be included in the update. Do you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateConfirm(false)}>Cancel</Button>
          <Button onClick={handleConfirmUpdate} color="primary">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserListView;