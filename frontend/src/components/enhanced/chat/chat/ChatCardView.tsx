import React from 'react';
import {
  Typography,
  ListItemButton,
  ListItemText,
  List,
  Box,
} from '@mui/material';
import { Person, Functions, Message as MessageIcon, AttachFile } from '@mui/icons-material';
import { ChatComponentProps } from '../../../../types/ChatTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import MessageShortListView from '../../message/message/MessageShortListView';
import { hasAnyReferences } from '../../../../types/ReferenceTypes';
import DataClusterManager from '../../data_cluster/data_cluster_manager/DataClusterManager';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';

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
      primary_text: "Agent Tools",
      secondary_text: (
        <List>
          {item.agent_tools && item.agent_tools.length > 0 ? (
            item.agent_tools.map((func, index) => (
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
          {item.retrieval_tools && item.retrieval_tools.length > 0 ? (
            item.retrieval_tools.map((func, index) => (
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
    },
    {
      icon: <AttachFile />,
      primary_text: "Data Cluster",
      secondary_text: item.data_cluster && hasAnyReferences(item.data_cluster) ? <DataClusterManager dataCluster={item.data_cluster} isEditable={false} /> : 'No data cluster'
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