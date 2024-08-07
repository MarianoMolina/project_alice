import React from 'react';
import {
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
} from '@mui/material';
import { SupportAgent, Functions } from '@mui/icons-material';
import { ChatComponentProps } from '../../../../types/ChatTypes';
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
    <Card className={classes.chatDetails}>
      <CardContent>
        <Typography variant="h6">{item.name}</Typography>
        <Typography variant="caption">
          Chat ID: {item._id}
        </Typography>
        <List>
          <ListItemButton onClick={() => item.alice_agent?._id && handleAgentClick && handleAgentClick(item.alice_agent._id)}>
            <ListItemIcon><SupportAgent /></ListItemIcon>
            <ListItemText primary="Alice Agent" secondary={item.alice_agent?.name || 'N/A'} />
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
      </CardContent>
    </Card>
  );
};

export default ChatCardView;