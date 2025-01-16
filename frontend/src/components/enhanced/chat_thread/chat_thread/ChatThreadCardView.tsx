import React from 'react';
import {
  Typography,
  Box,
} from '@mui/material';
import { Message as MessageIcon, QueryBuilder } from '@mui/icons-material';
import CommonCardView from '../../common/enhanced_component/CardView';
import { useDialog } from '../../../../contexts/DialogContext';
import { MessageType } from '../../../../types/MessageTypes';
import MessageShortListView from '../../message/message/MessageShortListView';
import { ChatThreadComponentProps, PopulatedChatThread } from '../../../../types/ChatThreadTypes';

const ChatThreadCardView: React.FC<ChatThreadComponentProps> = ({
  item,
}) => {

  const { selectCardItem } = useDialog();
  if (!item) {
    return <Typography>No chat data available.</Typography>;
  }

  const populatedItem = item as PopulatedChatThread

  const listItems = [
    {
      icon: <MessageIcon />,
      primary_text: "Messages",
      secondary_text: (
        <Box>
          <Typography variant="body2">Total: {populatedItem.messages.length}</Typography>
          {populatedItem.messages.map((message, index) => (
            <MessageShortListView
              key={`message-${index}${message}`}
              item={message as MessageType}
              mode={'view'}
              onView={(message) => selectCardItem && selectCardItem('Message', message._id ?? '', message)}
              handleSave={async () => { }}
              items={null}
              onChange={() => { }}
            />
          ))}
        </Box>
      )
    },
    {
      icon: <QueryBuilder />,
      primary_text: "Created At",
      secondary_text: new Date(populatedItem.createdAt || '').toLocaleString()
    }
  ];

  return (
    <>
      <CommonCardView
        elementType='ChatThread'
        title={populatedItem.name ?? 'Thread (no name)'}
        id={populatedItem._id}
        listItems={listItems}
        item={populatedItem}
        itemType='chatthreads'
      />
    </>
  );
};

export default ChatThreadCardView;