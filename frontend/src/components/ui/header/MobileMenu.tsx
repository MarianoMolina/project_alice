import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';
import { 
  Close as CloseIcon, 
  GitHub as GitHubIcon, 
  Logout,
  Article as ArticleIcon,
  Settings as SettingsIcon 
} from '@mui/icons-material';
import { NavigationButton } from './NavigationButton';
import { getSectionsByNavGroup, siteSections } from '../../../utils/SectionIcons';
import { User } from '../../../types/UserTypes';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onGitHubClick: () => void;
  isAuthenticated: boolean;
  user: User | null;
  classes: any;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  open,
  onClose,
  onNavigate,
  onLogout,
  onGitHubClick,
  isAuthenticated,
  user,
  classes,
}) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    classes={{ paper: classes.drawer }}
  >
    <Box className={classes.drawerHeader}>
      <Typography variant="h6">Menu</Typography>
      <IconButton onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Box>
    <Divider />
    <List className={classes.mobileMenuList}>
      <NavigationButton
        section={siteSections['home']}
        isMobile
        onClick={onNavigate}
      />
      <Divider />
     
      {isAuthenticated && (
        <>
          {[1, 2, 3].map((groupIndex) => (
            <Box key={groupIndex}>
              {getSectionsByNavGroup(groupIndex as 1 | 2 | 3).map((section, index) => (
                <React.Fragment key={section.id}>
                  <NavigationButton
                    section={section}
                    isMobile
                    onClick={onNavigate}
                  />
                </React.Fragment>
              ))}
            </Box>
          ))}
          {user && (
            <>
              <Divider />
              <ListItem>
                <Typography variant="subtitle1" color="textSecondary">
                  {user.email}
                </Typography>
              </ListItem>
              
              <NavigationButton
                section={siteSections['settings']}
                isMobile
                onClick={onNavigate}
              />

              <ListItemButton onClick={() => onNavigate('/terms-of-service')}>
                <ListItemIcon>
                  <ArticleIcon />
                </ListItemIcon>
                <ListItemText primary="Terms of Service" />
              </ListItemButton>

              <ListItemButton onClick={() => onNavigate('/privacy-policy')}>
                <ListItemIcon>
                  <ArticleIcon />
                </ListItemIcon>
                <ListItemText primary="Privacy Policy" />
              </ListItemButton>

              <ListItemButton onClick={onLogout}>
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
              <Divider />
            </>
          )}
        </>
      )}

      <ListItemButton onClick={onGitHubClick}>
        <ListItemIcon>
          <GitHubIcon />
        </ListItemIcon>
        <ListItemText primary="GitHub Repository" />
      </ListItemButton>
      <Divider />
     
      {!isAuthenticated && (
        <>
          <ListItemButton onClick={() => onNavigate('/login')}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Login" />
          </ListItemButton>
          <Divider />
        </>
      )}
    </List>
  </Drawer>
);