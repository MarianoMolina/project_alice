import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Add, List, PlayArrow, Assignment, ChevronRight, ChevronLeft } from '@mui/icons-material';
import useStyles from '../../styles/VerticalMenuStyles';

interface TaskVerticalMenuProps {
  activeTab: 'taskResults' | 'allTasks' | 'activeTask' | 'createTask';
  onTabChange: (tab: 'taskResults' | 'allTasks' | 'activeTask' | 'createTask') => void;
  isActiveTaskDisabled: boolean;
  isExpanded: boolean;
}

const TaskVerticalMenu: React.FC<TaskVerticalMenuProps> = ({
  activeTab,
  onTabChange,
  isActiveTaskDisabled,
  isExpanded
}) => {
  const classes = useStyles();

  return (
    <Box className={classes.verticalMenu}>
      <Tooltip title="Create New Task" placement="right">
        <IconButton
          onClick={() => onTabChange('createTask')}
          color={activeTab === 'createTask' ? 'primary' : 'default'}
        >
          <Add />
        </IconButton>
      </Tooltip>
      <Tooltip title="All Tasks" placement="right">
        <IconButton
          onClick={() => onTabChange('allTasks')}
          color={activeTab === 'allTasks' ? 'primary' : 'default'}
        >
          <List />
        </IconButton>
      </Tooltip>
      <Tooltip title="Task Results" placement="right">
        <IconButton
          onClick={() => onTabChange('taskResults')}
          color={activeTab === 'taskResults' ? 'primary' : 'default'}
        >
          <Assignment />
        </IconButton>
      </Tooltip>
      <Tooltip title={isActiveTaskDisabled ? "Select a task first" : "Active Task"} placement="right">
        <span>
          <IconButton
            onClick={() => onTabChange('activeTask')}
            color={activeTab === 'activeTask' ? 'primary' : 'default'}
            disabled={isActiveTaskDisabled}
          >
            <PlayArrow />
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

export default TaskVerticalMenu;