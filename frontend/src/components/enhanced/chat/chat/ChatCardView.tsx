import React from 'react';
import {
  Typography,
  ListItemButton,
  ListItemText,
  List,
  Box,
} from '@mui/material';
import { Person, Functions, Message as MessageIcon, AttachFile, QueryBuilder } from '@mui/icons-material';
import { ChatComponentProps, PopulatedAliceChat } from '../../../../types/ChatTypes';
import { hasAnyReferences, References } from '../../../../types/ReferenceTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import DataClusterManager from '../../data_cluster/data_cluster_manager/DataClusterManager';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import { MessageType } from '../../../../types/MessageTypes';
import MessageShortListView from '../../message/message/MessageShortListView';
import ApiValidationManager from '../../api/ApiValidationManager';

const ChatCardView: React.FC<ChatComponentProps> = ({
  item,
}) => {

  const { selectCardItem } = useCardDialog();
  if (!item) {
    return <Typography>No chat data available.</Typography>;
  }

  const populatedItem = item as PopulatedAliceChat

  const listItems = [
    {
      icon: <Person />,
      primary_text: "Alice Agent",
      secondary_text: (
        <ListItemButton onClick={() => populatedItem.alice_agent?._id && selectCardItem && selectCardItem('Agent', populatedItem.alice_agent._id, populatedItem.alice_agent)}>
          {populatedItem.alice_agent?.name || 'N/A'}
        </ListItemButton>
      )
    },
    {
      icon: <Functions />,
      primary_text: "Agent Tools",
      secondary_text: (
        <List>
          {populatedItem.agent_tools && populatedItem.agent_tools.length > 0 ? (
            populatedItem.agent_tools.map((func, index) => (
              <ListItemButton key={index} onClick={() => func._id && selectCardItem && selectCardItem('Task', func._id, func)}>
                <ListItemText primary={formatStringWithSpaces(func.task_name)} />
              </ListItemButton>
            ))
          ) : (
            <Typography variant="body2">No Agent Tools available</Typography>
          )}
        </List>
      )
    },
    {
      icon: <Functions />,
      primary_text: "Retrieval tools",
      secondary_text: (
        <List>
          {populatedItem.retrieval_tools && populatedItem.retrieval_tools.length > 0 ? (
            populatedItem.retrieval_tools.map((func, index) => (
              <ListItemButton key={index} onClick={() => func._id && selectCardItem && selectCardItem('Task', func._id, func)}>
                <ListItemText primary={formatStringWithSpaces(func.task_name)} />
              </ListItemButton>
            ))
          ) : (
            <Typography variant="body2">No Retrieval Tools available</Typography>
          )}
        </List>
      )
    },
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
      icon: <AttachFile />,
      primary_text: "Data Cluster",
      secondary_text: populatedItem.data_cluster && hasAnyReferences(populatedItem.data_cluster as References) ? <DataClusterManager dataCluster={populatedItem.data_cluster} isEditable={false} /> : 'No data cluster'
    },
    {
      icon: <QueryBuilder />,
      primary_text: "API validation",
      secondary_text: <ApiValidationManager chatId={item._id} />
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
        elementType='Chat'
        title={populatedItem.name}
        id={populatedItem._id}
        listItems={listItems}
        item={item as PopulatedAliceChat}
        itemType='chats'
      />
    </>
  );
};

export default ChatCardView;