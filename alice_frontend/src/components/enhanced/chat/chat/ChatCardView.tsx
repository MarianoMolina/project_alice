import React, { useState } from 'react';
import {
  Typography,
  ListItemButton,
  ListItemText,
  List,
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Person, Functions, Message as MessageIcon } from '@mui/icons-material';
import { ChatComponentProps, MessageType } from '../../../../types/ChatTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import MessageListView from '../../common/message/MessageList';
import MessageDetail from '../../common/message/MessageDetail';

const ChatCardView: React.FC<ChatComponentProps> = ({
  item,
  handleAgentClick,
  handleTaskClick,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(null);

  if (!item) {
    return <Typography>No chat data available.</Typography>;
  }

  const handleViewMessage = (message: MessageType) => {
    setSelectedMessage(message);
  };

  const handleCloseMessageDetail = () => {
    setSelectedMessage(null);
  };

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
            messages={item.messages}
            onView={handleViewMessage}
            // Note: We don't pass onEdit here as this is a view-only component
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
      <Dialog open={!!selectedMessage} onClose={handleCloseMessageDetail} maxWidth="md" fullWidth>
        {selectedMessage && (
          <DialogContent>
            <MessageDetail
              message={selectedMessage}
              chatId={item._id}
              mode="view"
              onClose={handleCloseMessageDetail}
            />
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={handleCloseMessageDetail}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatCardView;