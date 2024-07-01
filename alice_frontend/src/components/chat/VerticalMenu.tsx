import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Add, Chat, Info, ChevronRight, ChevronLeft, Functions, Assignment } from '@mui/icons-material';
import useStyles from '../../styles/VerticalMenuStyles';

interface VerticalMenuProps {
  activeTab: 'newChat' | 'selectChat' | 'currentChat' | 'addFunctions' | 'addTaskResults';
  onTabChange: (tab: 'newChat' | 'selectChat' | 'currentChat' | 'addFunctions' | 'addTaskResults') => void;
  isCurrentChatDisabled: boolean;
  isExpanded: boolean;
}

const VerticalMenu: React.FC<VerticalMenuProps> = ({ 
  activeTab, 
  onTabChange, 
  isCurrentChatDisabled, 
  isExpanded 
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.verticalMenu}>
      <Tooltip title="New Chat" placement="right">
        <IconButton
          onClick={() => onTabChange('newChat')}
          color={activeTab === 'newChat' ? 'primary' : 'default'}
        >
          <Add />
        </IconButton>
      </Tooltip>
      <Tooltip title="Select Chat" placement="right">
        <IconButton
          onClick={() => onTabChange('selectChat')}
          color={activeTab === 'selectChat' ? 'primary' : 'default'}
        >
          <Chat />
        </IconButton>
      </Tooltip>
      <Tooltip title={isCurrentChatDisabled ? "Select a chat first" : "Current Chat"} placement="right">
        <span>
          <IconButton
            onClick={() => onTabChange('currentChat')}
            color={activeTab === 'currentChat' ? 'primary' : 'default'}
            disabled={isCurrentChatDisabled}
          >
            <Info />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={isCurrentChatDisabled ? "Select a chat first" : "Add Functions"} placement="right">
        <span>
          <IconButton
            onClick={() => onTabChange('addFunctions')}
            color={activeTab === 'addFunctions' ? 'primary' : 'default'}
            disabled={isCurrentChatDisabled}
          >
            <Functions />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={isCurrentChatDisabled ? "Select a chat first" : "Add Task Results"} placement="right">
        <span>
          <IconButton
            onClick={() => onTabChange('addTaskResults')}
            color={activeTab === 'addTaskResults' ? 'primary' : 'default'}
            disabled={isCurrentChatDisabled}
          >
            <Assignment />
          </IconButton>
        </span>
      </Tooltip>
      <Box className={classes.expandButton}>
        <Tooltip title={isExpanded ? "Collapse" : "Expand"} placement="right">
          <IconButton onClick={() => onTabChange(activeTab)}>
            {isExpanded ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default VerticalMenu;