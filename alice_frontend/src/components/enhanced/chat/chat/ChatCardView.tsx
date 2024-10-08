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
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import MessageShortListView from '../../message/message/MessageShortListView';

const ChatCardView: React.FC<ChatComponentProps> = ({
  item,
}) => {

  const { selectCardItem } = useCardDialog();
  if (!item) {
    return <Typography>No chat data available.</Typography>;
  }

  const listItems = [
    {
      icon: <Person />,
      primary_text: "Alice Agent",
      secondary_text: (
        <ListItemButton onClick={() => item.alice_agent?._id && selectCardItem && selectCardItem('Agent', item.alice_agent._id, item.alice_agent)}>
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
              <ListItemButton key={index} onClick={() => func._id && selectCardItem && selectCardItem('Task', func._id, func)}>
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
          <MessageShortListView
            items={item.messages || []}
            item={null}
            onChange={() => { }}
            mode={'view'}
            handleSave={async () => { }}
            onView={(message) => selectCardItem && selectCardItem('Message', message._id ?? '', message)}
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
        item={item}
        itemType='chats'
      />
    </>
  );
};

export default ChatCardView;