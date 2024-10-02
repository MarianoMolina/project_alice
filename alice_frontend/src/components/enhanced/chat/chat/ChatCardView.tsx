import React from 'react';
import {
  Typography,
  ListItemButton,
  ListItemText,
  List,
  Box,
} from '@mui/material';
import { Person, Functions, Message as MessageIcon } from '@mui/icons-material';
import { ChatComponentProps } from '../../../../types/ChatTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import MessageListView from '../../message/message/MessageListView';

const ChatCardView: React.FC<ChatComponentProps> = ({
  item,
  handleAgentClick,
  handleTaskClick,
  handleMessageClick,
}) => {

  if (!item) {
    return <Typography>No chat data available.</Typography>;
  }

  const listItems = [
    {
      icon: <Person />,
      primary_text: "Alice Agent",
      secondary_text: (
        <ListItemButton onClick={() => item.alice_agent?._id && handleAgentClick && handleAgentClick(item.alice_agent._id)}>
          {item.alice_agent?.name || 'N/A'}
        </ListItemButton>
      )
    },
    {
      icon: <Functions />,
      primary_text: "Available Functions",
      secondary_text: (
        <List>
          {item.functions && item.functions.length > 0 ? (
            item.functions.map((func, index) => (
              <ListItemButton key={index} onClick={() => func._id && handleTaskClick && handleTaskClick(func._id)}>
                <ListItemText primary={func.task_name} />
              </ListItemButton>
            ))
          ) : (
            <Typography variant="body2">No functions available</Typography>
          )}
        </List>
      )
    },
    {
      icon: <MessageIcon />,
      primary_text: "Messages",
      secondary_text: (
        <Box>
          <Typography variant="body2">Total: {item.messages.length}</Typography>
          <MessageListView
            items={item.messages || []}
            item={null}
            onChange={() => { }}
            mode={'view'}
            handleSave={async () => { }}
            onView={(message) => handleMessageClick && handleMessageClick(message._id ?? '', message)}
          />
        </Box>
      )
    }
  ];

  return (
    <>
      <CommonCardView
        elementType='Chat'
        title={item.name}
        id={item._id}
        listItems={listItems}
      />
    </>
  );
};

export default ChatCardView;