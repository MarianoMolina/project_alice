import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TaskType } from '../../../../types/TaskTypes';
import TaskCapabilities from './TaskTypeDescription';


interface TaskCapabilitiesDialogProps {
  open: boolean;
  onClose: () => void;
  taskType?: TaskType;
}

const TaskCapabilitiesDialog: React.FC<TaskCapabilitiesDialogProps> = ({
  open,
  onClose,
  taskType,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box className="flex items-center gap-2">
            <Typography variant="h6">
              Task Capabilities
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TaskCapabilities taskType={taskType} />
      </DialogContent>
    </Dialog>
  );
};

export default TaskCapabilitiesDialog;