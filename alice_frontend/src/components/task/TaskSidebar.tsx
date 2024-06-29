import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
} from '@mui/material';
import {
  ExpandMore,
  Category,
  LibraryBooks,
  AddCircleOutline,
} from '@mui/icons-material';
import { AliceTask, Prompt } from '../../utils/types';
import useStyles from '../../styles/TaskSidebarStyles';
import PromptComponent from '../db_elements/PromptComponent';

interface TaskSidebarProps {
  tasks: AliceTask[];
  onSelectTask: (task: AliceTask) => void;
  onCreateTask: () => void;
  selectedTask: AliceTask | null;
  viewTask: (taskId?: string) => void;
}

const TaskSidebar: React.FC<TaskSidebarProps> = ({
  tasks,
  onSelectTask,
  onCreateTask,
  selectedTask,
  viewTask,
}) => {
  const classes = useStyles();
  const [expandedAccordion, setExpandedAccordion] = useState<'allTasks' | 'activeTask' | false>('allTasks');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);

  const handleAccordionChange = (panel: 'allTasks' | 'activeTask') => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const handlePromptClick = (promptId: string) => {
    setSelectedPromptId(promptId);
    setIsPromptDialogOpen(true);
  };

  const handleClosePromptDialog = () => {
    setIsPromptDialogOpen(false);
    setSelectedPromptId(null);
  };

  const getPromptId = (value: string | Prompt): string => {
    if (typeof value === 'string') {
      return value;
    }
    return value._id || '';
  };

  const renderPromptList = (prompts: Map<string, string | Prompt> | Record<string, string | Prompt> | null) => {
    if (!prompts) return null;

    const entries = prompts instanceof Map ? Array.from(prompts.entries()) : Object.entries(prompts);

    return (
      <List className={classes.nestedList}>
        {entries.map(([promptName, value]) => {
          const promptId = getPromptId(value);
          return (
            <ListItemButton key={promptName} onClick={() => handlePromptClick(promptId)}>
              <ListItemText primary={promptName} />
            </ListItemButton>
          );
        })}
      </List>
    );
  };

  const onSelectTaskActivate = (task: AliceTask) => {
    onSelectTask(task);
    setExpandedAccordion('activeTask');
  }

  return (
    <Box className={classes.sidebar}>
      <Box className={classes.accordionsContainer}>
        <Accordion
          expanded={expandedAccordion === 'allTasks'}
          onChange={handleAccordionChange('allTasks')}
          className={classes.accordion}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>All Tasks</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordionDetails}>
            <List className={classes.tasksList}>
              {tasks.map((task) => (
                <ListItemButton
                  key={task._id}
                  onClick={() => onSelectTaskActivate(task)}
                  selected={task._id === selectedTask?._id}
                >
                  <ListItemText
                    primary={task.task_name}
                    secondary={task.task_description}
                  />
                </ListItemButton>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedAccordion === 'activeTask'}
          onChange={handleAccordionChange('activeTask')}
          disabled={!selectedTask}
          className={classes.accordion}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Active Task</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordionDetails}>
            {selectedTask && (
              <>
                <Box className={classes.taskDetailsHeader}>
                  <Typography variant="subtitle1">{selectedTask.task_name}</Typography>
                  <Typography variant="body2">{selectedTask.task_description}</Typography>
                  <Typography variant="caption" className={classes.taskId}>
                    Task ID: {selectedTask._id}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => viewTask(selectedTask._id)}
                  >
                    View Task
                  </Button>
                </Box>

                <List>
                  <ListItemButton>
                    <ListItemIcon><Category /></ListItemIcon>
                    <ListItemText primary="Task Type" secondary={selectedTask.task_type} />
                  </ListItemButton>

                  <ListItemButton>
                    <ListItemIcon><LibraryBooks /></ListItemIcon>
                    <ListItemText
                      primary="Templates"
                      secondary={`${Object.keys(selectedTask.templates || {}).length} template(s)`}
                    />
                  </ListItemButton>

                  {renderPromptList(selectedTask.templates)}

                  <ListItemButton>
                    <ListItemIcon><AddCircleOutline /></ListItemIcon>
                    <ListItemText
                      primary="Prompts to Add"
                      secondary={`${Object.keys(selectedTask.prompts_to_add || {}).length} prompt(s)`}
                    />
                  </ListItemButton>

                  {renderPromptList(selectedTask.prompts_to_add)}
                </List>
              </>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box className={classes.newTaskButtonContainer}>
        <Button
          className={classes.newTaskButton}
          variant="contained"
          onClick={onCreateTask}
        >
          Create New Task
        </Button>
      </Box>

      <Dialog open={isPromptDialogOpen} onClose={handleClosePromptDialog} maxWidth="md" fullWidth>
        {selectedPromptId && <PromptComponent promptId={selectedPromptId} onClose={handleClosePromptDialog} />}
      </Dialog>
    </Box>
  );
};

export default TaskSidebar;