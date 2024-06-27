import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Tooltip, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import ChatIcon from '@mui/icons-material/Chat';
import BuildIcon from '@mui/icons-material/Build';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Tooltip title="Home">
          <IconButton edge="start" color="inherit" onClick={() => handleNavigation('/')}>
            <HomeIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flexGrow: 1 }} />
        {isAuthenticated ? (
          <>
            <Tooltip title="Execute Task">
              <IconButton color="inherit" onClick={() => handleNavigation('/start-task')}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chat with Alice">
              <IconButton color="inherit" onClick={() => handleNavigation('/chat-alice')}>
                <ChatIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Database">
              <IconButton color="inherit" onClick={() => handleNavigation('/database')}>
                <StorageIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Configure Alice Tools">
              <IconButton color="inherit" onClick={() => handleNavigation('/alice-tools')}>
                <BuildIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body1" sx={{ marginRight: 2 }}>
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
      </Toolbar>
    </AppBar>
  );
};

export default Header;
