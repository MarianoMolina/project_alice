import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Tooltip, Button, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import ChatIcon from '@mui/icons-material/Chat';
import { useAuth } from '../context/AuthContext';
import useStyles from '../styles/HeaderStyles';

const Header: React.FC = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static">
      <Toolbar className={classes.toolbar}>
        <Box className={classes.leftSection}>
          <Tooltip title="Home">
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => handleNavigation('/')}
              className={isActive('/') ? classes.activeButton : ''}
            >
              <HomeIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {isAuthenticated && (
          <Box className={classes.centerSection}>
            <Tooltip title="Execute Task">
              <IconButton
                color="inherit"
                onClick={() => handleNavigation('/start-task')}
                className={isActive('/start-task') ? classes.activeButton : ''}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chat with Alice">
              <IconButton
                color="inherit"
                onClick={() => handleNavigation('/chat-alice')}
                className={isActive('/chat-alice') ? classes.activeButton : ''}
              >
                <ChatIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Database">
              <IconButton
                color="inherit"
                onClick={() => handleNavigation('/database')}
                className={isActive('/database') ? classes.activeButton : ''}
              >
                <StorageIcon />
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
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
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