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
  OpenInFull as OpenInFullIcon,
  UnfoldLess as UnfoldLessIcon,
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
import theme from '../../../Theme';
import EnhancedChatThread from '../../enhanced/chat_thread/chat_thread/EnhancedChat';

interface ActiveChatDetailsProps {
  onThreadSelected?: (thread: ChatThread) => void;
}

enum ChatDetailAccordions {
  THREADS = 'threads',
  DETAILS = 'details'
}

const ActiveChatDetails: React.FC<ActiveChatDetailsProps> = ({ onThreadSelected }) => {
  const {
    currentChat,
    handleSelectThread,
    threads
  } = useChat();

  const {
    selectCardItem,
    selectEnhancedOptions,
  } = useDialog();

  const [expanded, setExpanded] = useState<ChatDetailAccordions>(ChatDetailAccordions.THREADS);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const handleAccordionChange = useCallback((panel: ChatDetailAccordions) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    if (expanded === panel) {
      // If clicking the open accordion, switch to the other one
      setExpanded(panel === ChatDetailAccordions.THREADS ? ChatDetailAccordions.DETAILS : ChatDetailAccordions.THREADS);
    } else {
      // If clicking the closed accordion, open it
      setExpanded(panel);
    }
  }, [expanded]);


  const handleThreadSelect = useCallback(async (thread: PopulatedChatThread | ChatThread) => {
    if (!thread._id) return;
    await handleSelectThread(thread._id);
    onThreadSelected && onThreadSelected(thread as ChatThread);
  }, [handleSelectThread, onThreadSelected]);

  const handleCreateThread = useCallback(() => {
    // TODO: Implement creating new thread
    setIsCreatingThread(true);
  }, []);

  const handleAddExistingThread = useCallback(() => {
    // TODO: This should add to current chat and then select
    selectEnhancedOptions(
      'chatthreads',
      EnhancedChatThread,
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
        expanded={expanded === ChatDetailAccordions.THREADS}
        onChange={handleAccordionChange(ChatDetailAccordions.THREADS)}
        sx={{
          flex: expanded === ChatDetailAccordions.THREADS ? 1 : 'none',
          borderRadius: '0 !important',
          background: 'none !important',
          display: 'flex',
          margin: '0 !important',
          flexDirection: 'column',
        }}
      >
        <AccordionSummary
          expandIcon={expanded === ChatDetailAccordions.THREADS ? 
            <UnfoldLessIcon /> : 
            <OpenInFullIcon />
          }
          sx={{
            background: expanded === ChatDetailAccordions.THREADS ? theme.palette.primary.main : 'transparent',
            minHeight: '0 !important',
            height: '56px'
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
            {expanded === ChatDetailAccordions.THREADS && (
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
            )}
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
        expanded={expanded === ChatDetailAccordions.DETAILS}
        onChange={handleAccordionChange(ChatDetailAccordions.DETAILS)}
        sx={{
          flex: expanded === ChatDetailAccordions.DETAILS ? 1 : 'none',
          borderRadius: '0 !important',
          margin: '0 !important',
          background: 'none !important',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AccordionSummary
          expandIcon={expanded === ChatDetailAccordions.DETAILS ? 
            <UnfoldLessIcon /> : 
            <OpenInFullIcon />
          }
          sx={{
            background: expanded === ChatDetailAccordions.DETAILS ? theme.palette.primary.main : 'transparent',
            minHeight: '0 !important',
            height: '56px'
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