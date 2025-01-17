import React from 'react';
import {
  Typography,
  ListItemButton,
  ListItemText,
  List,
  Box,
  Chip,
} from '@mui/material';
import { Person, Functions, Message as MessageIcon, AttachFile, QueryBuilder, ContactMail } from '@mui/icons-material';
import { ChatComponentProps, PopulatedAliceChat } from '../../../../types/ChatTypes';
import { hasAnyReferences, References } from '../../../../types/ReferenceTypes';
import CommonCardView from '../../../common/enhanced_component/CardView';
import DataClusterManager from '../../data_cluster/data_cluster_manager/DataClusterManager';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';
import { useDialog } from '../../../../contexts/DialogContext';
import ApiValidationManager from '../../api/ApiValidationManager';
import theme from '../../../../Theme';
import ManageReferenceList from '../../../common/referecence_list_manager/ManageReferenceList';

const ChatCardView: React.FC<ChatComponentProps> = ({
  item,
}) => {

  const { selectCardItem } = useDialog();
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
      primary_text: "Threads",
      secondary_text: (
        <ManageReferenceList
          collectionType="chatthreads"
          elementIds={populatedItem.threads?.map(thread => thread._id!) || []}
          onListChange={() => null}
          isEditable={false}
        />
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
      icon: <ContactMail />,
      primary_text: "User Checkpoints",
      secondary_text: (
        !item.default_user_checkpoints || Object.keys(item.default_user_checkpoints).length === 0 ?
          <Typography variant="body2" color="textSecondary">No user checkpoints defined</Typography> :
          <Box>
            {Object.entries(item.default_user_checkpoints).map(([nodeName, checkpoint]) => (
              checkpoint && (
                <Chip
                  key={nodeName}
                  label={`${nodeName}`}
                  onClick={() => selectCardItem && checkpoint._id && selectCardItem('UserCheckpoint', checkpoint._id, checkpoint)}
                  sx={{ margin: `${theme.spacing(0.25)} !important` }}
                />
              )
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