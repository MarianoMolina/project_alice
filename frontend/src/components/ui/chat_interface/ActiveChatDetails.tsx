import React, { useState, useCallback } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  PlaylistAdd as PlaylistAddIcon,
} from '@mui/icons-material';
import { useChat } from '../../../contexts/ChatContext';
import { useDialog } from '../../../contexts/DialogContext';
import ChatThreadShortListView from '../../enhanced/chat_thread/chat_thread/ChatThreadShortListView';
import ChatCardView from '../../enhanced/chat/chat/ChatCardView';
import { ChatThread, PopulatedChatThread } from '../../../types/ChatThreadTypes';
import CreateThreadInChat from './CreateThreadInChat';
import Logger from '../../../utils/Logger';

interface ActiveChatDetailsProps {
  onThreadSelected?: (thread: ChatThread) => void;
}

const ActiveChatDetails: React.FC<ActiveChatDetailsProps> = ({onThreadSelected}) => {
  const {
    currentChat,
    currentThread,
    handleSelectThread,
    threads
  } = useChat();

  const {
    selectCardItem,
    selectEnhancedOptions,
  } = useDialog();

  const [expanded, setExpanded] = useState<'threads' | 'details'>('threads');
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const handleAccordionChange = useCallback((panel: 'threads' | 'details') => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : 'threads');
  },
    []
  );

  const handleThreadSelect = useCallback(async (thread: PopulatedChatThread | ChatThread) => {
    if (!thread._id) return;
    await handleSelectThread(thread._id);
    onThreadSelected && onThreadSelected(thread as ChatThread);
  }, [handleSelectThread, onThreadSelected]);

  const handleCreateThread = useCallback(() => {
    setIsCreatingThread(true);
  }, []);

  const handleAddExistingThread = useCallback(() => {
    selectEnhancedOptions(
      'chatthreads',
      ChatThreadShortListView,
      'Select Thread to Add',
      (thread: PopulatedChatThread) => {
        if (thread._id) {
          handleSelectThread(thread._id);
        }
      },
      false
    );
  }, [selectEnhancedOptions, handleSelectThread]);

  const handleViewThread = useCallback((thread: PopulatedChatThread | ChatThread) => {
    Logger.info('Viewing thread:', thread);
    if (thread._id) {
      selectCardItem('ChatThread', thread._id);
    }
  }, [selectCardItem]);

  if (!currentChat) return null;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Accordion
        expanded={expanded === 'threads'}
        onChange={handleAccordionChange('threads')}
        sx={{
          flex: expanded === 'threads' ? 1 : 'none',
          display: 'flex',
          margin: '0 !important',
          flexDirection: 'column'
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            pr: 2
          }}>
            <Typography>Select Thread</Typography>
            <Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateThread();
                }}
                title="Create New Thread"
              >
                <AddIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddExistingThread();
                }}
                title="Add Existing Thread"
              >
                <PlaylistAddIcon />
              </IconButton>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{
          flex: 1,
          overflow: 'auto',
          padding: 0
        }}>
          <ChatThreadShortListView
            items={threads || []}
            item={null}
            mode="view"
            onView={handleViewThread}
            onInteraction={handleThreadSelect}
            onChange={() => null}
            handleSave={async () => { }}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'details'}
        onChange={handleAccordionChange('details')}
        sx={{
          flex: expanded === 'details' ? 1 : 'none',
          margin: '0 !important',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Typography>Chat Details</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{
          flex: 1,
          overflow: 'auto',
          padding: 0
        }}>
          <ChatCardView
            items={null}
            item={currentChat}
            mode="view"
            onChange={() => null}
            handleSave={async () => { }}
          />
        </AccordionDetails>
      </Accordion>
      <CreateThreadInChat
        open={isCreatingThread}
        onClose={() => setIsCreatingThread(false)}
      />
    </Box>
  );
};

export default ActiveChatDetails;