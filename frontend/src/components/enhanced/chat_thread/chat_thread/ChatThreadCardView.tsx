import React, { useMemo } from 'react';
import {
  Typography,
} from '@mui/material';
import { Message as MessageIcon, QueryBuilder } from '@mui/icons-material';
import CommonCardView from '../../../common/enhanced_component/CardView';
import { ChatThreadComponentProps, PopulatedChatThread } from '../../../../types/ChatThreadTypes';
import ManageReferenceList from '../../../common/referecence_list_manager/ManageReferenceList';

const ChatThreadCardView: React.FC<ChatThreadComponentProps> = ({
  item,
}) => {

  const populatedItem = item ? item as PopulatedChatThread : null;

  const memoizedThreadList = useMemo(() => {
    return (
      <ManageReferenceList
        collectionType="messages"
        elementIds={populatedItem?.messages?.map(thread => thread._id!) || []}
        onListChange={() => null}
        isEditable={false}
      />
    );
  }, [populatedItem?.messages]);

  if (!item || !populatedItem) {
    return <Typography>No chat data available.</Typography>;
  }

  const listItems = [
    {
      icon: <MessageIcon />,
      primary_text: "Messages",
      secondary_text: memoizedThreadList
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