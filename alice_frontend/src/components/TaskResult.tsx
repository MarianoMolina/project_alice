import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface TaskResponse {
  task_name: string;
  task_description: string;
  status: 'pending' | 'complete' | 'failed';
  result_code: number;
  task_outputs?: Record<string, any>;
  result_diagnostic?: string;
  task_content?: Record<string, any>;
  usage_metrics?: Record<string, any>;
  execution_history?: Record<string, any>[];
}

interface TaskResultProps {
  taskResponse: TaskResponse;
}

const TaskResult: React.FC<TaskResultProps> = ({ taskResponse }) => {
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Task: {taskResponse.task_name}
      </Typography>
      <Typography variant="body1">{taskResponse.task_description}</Typography>
      <Typography variant="body2" color="textSecondary">
        Status: {taskResponse.status}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Result Code: {taskResponse.result_code}
      </Typography>
      {taskResponse.task_outputs && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Outputs:
          </Typography>
          <Typography variant="body2">{JSON.stringify(taskResponse.task_outputs)}</Typography>
        </Box>
      )}
      {taskResponse.result_diagnostic && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Diagnostic:
          </Typography>
          <Typography variant="body2">{taskResponse.result_diagnostic}</Typography>
        </Box>
      )}
      {taskResponse.task_content && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Task Content:
          </Typography>
          <Typography variant="body2">{JSON.stringify(taskResponse.task_content)}</Typography>
        </Box>
      )}
      {taskResponse.usage_metrics && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Usage Metrics:
          </Typography>
          <Typography variant="body2">{JSON.stringify(taskResponse.usage_metrics)}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TaskResult;
