import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  ListItem
} from '@mui/material';
import { Settings, Logout, Article } from '@mui/icons-material';
import { User } from '../../../types/UserTypes';

interface UserMenuProps {
  user: User | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  anchorEl,
  onClose,
  onLogout,
  onNavigate,
}) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    onClick={onClose}
    PaperProps={{
      sx: { width: 320, maxWidth: '100%' }
    }}
    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
  >
    <ListItem>
      <Typography variant="body1" color="textSecondary">
        {user?.email}
      </Typography>
    </ListItem>
    <Divider />
    <MenuItem onClick={() => onNavigate('/user-settings')}>
      <ListItemIcon>
        <Settings fontSize="small" />
      </ListItemIcon>
      <ListItemText>Account Settings</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => onNavigate('/terms-of-service')}>
      <ListItemIcon>
        <Article fontSize="small" />
      </ListItemIcon>
      <ListItemText>Terms of Service</ListItemText>
    </MenuItem>
    <MenuItem onClick={() => onNavigate('/privacy-policy')}>
      <ListItemIcon>
        <Article fontSize="small" />
      </ListItemIcon>
      <ListItemText>Privacy Policy</ListItemText>
    </MenuItem>
    <Divider />
    <MenuItem onClick={onLogout}>
      <ListItemIcon>
        <Logout fontSize="small" />
      </ListItemIcon>
      <ListItemText>Logout</ListItemText>
    </MenuItem>
  </Menu>
);