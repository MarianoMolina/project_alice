import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import ChatIcon from '@mui/icons-material/Chat';
import BuildIcon from '@mui/icons-material/Build';
import '../App.css';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Tooltip title="Home">
          <IconButton edge="start" color="inherit" onClick={() => handleNavigation('/')}>
            <HomeIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Execute Task">
          <IconButton color="inherit" onClick={() => handleNavigation('/start-workflow')}>
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
      </Toolbar>
    </AppBar>
  );
};

export default Header;
