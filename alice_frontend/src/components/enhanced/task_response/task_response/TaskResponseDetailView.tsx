import React from 'react';
import {
    Typography,
    Paper,
    Box,
} from '@mui/material';
import { TaskResponseComponentProps } from '../../../../utils/TaskResponseTypes';

const TaskResponseCardView: React.FC<TaskResponseComponentProps> = ({
    item,
}) => {
    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    return (
        <Paper elevation={3} sx={{ p: 2}}>
          <Typography variant="h6" gutterBottom>
            Task: {item.task_name}
          </Typography>
          <Typography variant="body1">{item.task_description}</Typography>
          <Typography variant="body2" color="textSecondary">
            Status: {item.status}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Result Code: {item.result_code}
          </Typography>
          {item.task_outputs && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Outputs:
              </Typography>
              <Typography variant="body2">{JSON.stringify(item.task_outputs)}</Typography>
            </Box>
          )}
          {item.result_diagnostic && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Diagnostic:
              </Typography>
              <Typography variant="body2">{item.result_diagnostic}</Typography>
            </Box>
          )}
          {item.usage_metrics && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Usage Metrics:
              </Typography>
              <Typography variant="body2">{JSON.stringify(item.usage_metrics)}</Typography>
            </Box>
          )}
        </Paper>
    );
};

export default TaskResponseCardView;