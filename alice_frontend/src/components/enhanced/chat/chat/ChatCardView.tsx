import React from 'react';
import {
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { SupportAgent, Terminal, Functions, Summarize } from '@mui/icons-material';
import { ChatComponentProps } from '../../../../utils/ChatTypes';
import useStyles from '../ChatStyles';

const ChatCardView: React.FC<ChatComponentProps> = ({
  item,
  handleAgentClick,
  handleTaskClick,
  handleTaskResultClick,
}) => {
  const classes = useStyles();

  if (!item) {
    return <Typography>No chat data available.</Typography>;
  }

  return (
    <div className={classes.chatDetails}>
      <Typography variant="h6">Agents</Typography>
      <List>
        <ListItemButton onClick={() => item.alice_agent?._id && handleAgentClick && handleAgentClick(item.alice_agent._id)}>
          <ListItemIcon><SupportAgent /></ListItemIcon>
          <ListItemText primary="Alice Agent" secondary={item.alice_agent?.name || 'N/A'} />
        </ListItemButton>
        <ListItemButton onClick={() => item.executor?._id && handleAgentClick && handleAgentClick(item.executor._id)}>
          <ListItemIcon><Terminal /></ListItemIcon>
          <ListItemText primary="Execution Agent" secondary={item.executor?.name || 'N/A'} />
        </ListItemButton>
      </List>
      <Typography variant="h6">Available Functions</Typography>
      <List>
        {item.functions && item.functions.length > 0 ? (
          item.functions.map((func, index) => (
            <ListItemButton key={index} onClick={() => func._id && handleTaskClick && handleTaskClick(func._id)}>
              <ListItemIcon><Functions /></ListItemIcon>
              <ListItemText primary={func.task_name} />
            </ListItemButton>
          ))
        ) : (
          <Typography variant="body2">No functions available</Typography>
        )}
      </List>
      <Typography variant="h6">Task Results</Typography>
      <List>
        {item.task_responses && item.task_responses.length > 0 ? (
          item.task_responses.map((result, index) => (
            <ListItemButton key={index} onClick={() => result._id && handleTaskResultClick && handleTaskResultClick(result._id)}>
              <ListItemIcon><Summarize /></ListItemIcon>
              <ListItemText
                primary={result.task_name}
                secondary={`Status: ${result.status}, Code: ${result.result_code}`}
              />
            </ListItemButton>
          ))
        ) : (
          <Typography variant="body2">No task responses yet</Typography>
        )}
      </List>
    </div>
  );
};

export default ChatCardView;