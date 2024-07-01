import React, { useState } from 'react';
import { List, ListItem, ListItemText, IconButton, Dialog, Tooltip } from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { TaskResponse } from '../../utils/types';
import TaskResult from '../db_elements/TaskResult';

interface TaskResultListProps {
  taskResults: TaskResponse[];
  onAddTaskResult: (taskResultId: string) => Promise<void>;
  isTaskResultInChat: (taskResultId: string) => boolean;
}

const TaskResultList: React.FC<TaskResultListProps> = ({ taskResults, onAddTaskResult, isTaskResultInChat }) => {
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  const handleResultClick = (resultId: string) => {
    setSelectedResultId(resultId);
    setOpenResultDialog(true);
  };

  const handleAddResult = async (resultId: string) => {
    await onAddTaskResult(resultId);
  };

  return (
    <List>
      {taskResults.map((result) => (
        <ListItem key={result._id} dense>
          <ListItemText
            primary={result.task_name}
            secondary={`Status: ${result.status}, Code: ${result.result_code}`}
          />
          <Tooltip title="View Task Result">
            <IconButton edge="end" onClick={() => result._id && handleResultClick(result._id)}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title={isTaskResultInChat(result._id || '') ? "Already in chat" : "Add to chat"}>
            <span>
              <IconButton
                edge="end"
                onClick={() => result._id && handleAddResult(result._id)}
                disabled={isTaskResultInChat(result._id || '')}
              >
                <Add />
              </IconButton>
            </span>
          </Tooltip>
        </ListItem>
      ))}
      <Dialog open={openResultDialog} onClose={() => setOpenResultDialog(false)}>
        {selectedResultId && <TaskResult taskResponse={taskResults.find(r => r._id === selectedResultId)!} />}
      </Dialog>
    </List>
  );
};

export default TaskResultList;