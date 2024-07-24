import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Tooltip, Button, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { SettingsApplications, Storage, Chat, Task, Home } from '@mui/icons-material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../../context/AuthContext';
import useStyles from './HeaderStyles';

const Header: React.FC = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    console.log('Logging out');
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static" className={classes.header}>
      <Toolbar className={classes.toolbar}>
        <Box className={classes.leftSection}>
          <Tooltip title="Home">
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => handleNavigation('/')}
              className={isActive('/') ? classes.activeButton : ''}
            >
              <Home />
            </IconButton>
          </Tooltip>
        </Box>

        {isAuthenticated && (
          <Box className={classes.centerSection}>
            <Tooltip title="Chat with Alice">
              <IconButton
                color="inherit"
                onClick={() => handleNavigation('/chat-alice')}
                className={isActive('/chat-alice') ? classes.activeButton : ''}
              >
                <Chat />
              </IconButton>
            </Tooltip>
            <Tooltip title="Execute Task">
              <IconButton
                color="inherit"
                onClick={() => handleNavigation('/start-task')}
                className={isActive('/start-task') ? classes.activeButton : ''}
              >
                <Task />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Database">
              <IconButton
                color="inherit"
                onClick={() => handleNavigation('/database')}
                className={isActive('/database') ? classes.activeButton : ''}
              >
                <Storage />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Box className={classes.rightSection}>
          {isAuthenticated ? (
            <>
              <Typography variant="body1" className={classes.userEmail}>
                {user?.email}
              </Typography>
              <Tooltip title="User Settings">
                <IconButton
                  color="inherit"
                  onClick={() => handleNavigation('/user-settings')}
                  className={isActive('/user-settings') ? classes.activeButton : ''}
                >
                  <SettingsApplications />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton
                  color="inherit"
                  onClick={handleLogout}
                >
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button color="inherit" onClick={() => handleNavigation('/login')}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;