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
  QuestionAnswer,
  Info,
  Delete,
} from '@mui/icons-material';
import { useChat } from '../../../contexts/ChatContext';
import { useDialog } from '../../../contexts/DialogContext';
import ChatThreadShortListView from '../../enhanced/chat_thread/chat_thread/ChatThreadShortListView';
import ChatCardView from '../../enhanced/chat/chat/ChatCardView';
import { ChatThread, PopulatedChatThread } from '../../../types/ChatThreadTypes';
import Logger from '../../../utils/Logger';
import theme from '../../../Theme';
import EnhancedChatThread from '../../enhanced/chat_thread/chat_thread/EnhancedChat';
import ChatThreadCardView from '../../enhanced/chat_thread/chat_thread/ChatThreadCardView';

interface ActiveChatDetailsProps {
  onThreadSelected?: (thread: ChatThread) => void;
}

enum ChatDetailAccordions {
  THREADS = 'threads',
  DETAILS = 'details',
  THREAD_DETAILS = 'thread_details',
}

const ActiveChatDetails: React.FC<ActiveChatDetailsProps> = ({ onThreadSelected }) => {
  const {
    currentChat,
    handleSelectThread,
    threads,
    addThread,
    removeThread,
    currentThread
  } = useChat();

  const {
    selectFlexibleItem,
    selectCardItem,
    selectEnhancedOptions,
  } = useDialog();

  const [expanded, setExpanded] = useState<ChatDetailAccordions>(ChatDetailAccordions.THREADS);

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

  const handleThreadRemove = useCallback(async (threadId: string) => {
    await removeThread(threadId);
  }, [removeThread]);

  const handleThreadSelect = useCallback(async (thread: PopulatedChatThread | ChatThread) => {
    if (!thread._id) return;
    await handleSelectThread(thread._id);
    onThreadSelected && onThreadSelected(thread as ChatThread);
  }, [handleSelectThread, onThreadSelected]);

  const localOnSaveNew = useCallback(async (newItem: any) => {
    if (!newItem || !newItem._id) {
      Logger.warn('ManageReferenceList: Received invalid item in localOnSaveNew:', newItem);
      return;
    }
    await addThread(newItem._id);
  }, [addThread]);

  const handleCreateThread = useCallback(() => {
    Logger.info('handleCreateThread: About to call selectFlexibleItem with callback:', localOnSaveNew);
    selectFlexibleItem(
      'ChatThread',
      'create',
      undefined,
      undefined,
      localOnSaveNew
    );
  }, [selectFlexibleItem, localOnSaveNew]);

  const handleAddExistingThread = useCallback(() => {
    selectEnhancedOptions(
      'chatthreads',
      EnhancedChatThread,
      'Select Thread to Add',
      (thread: PopulatedChatThread) => {
        if (thread._id) {
          addThread(thread._id);
        }
      },
      false
    );
    // Needs to update the chat with the new thread
  }, [selectEnhancedOptions, addThread]);

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
            height: '56px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: expanded === ChatDetailAccordions.DETAILS 
                ? theme.palette.primary.dark 
                : theme.palette.action.hover,
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Typography><Info /> Chat Details</Typography>
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
            height: '56px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: expanded === ChatDetailAccordions.THREADS 
                ? theme.palette.primary.dark 
                : theme.palette.action.hover,
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            pr: 2
          }}>
            <Typography><QuestionAnswer /> Select Thread</Typography>
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
          {(threads || []).map((thread) => (
            <Box key={thread._id} sx={{
              display: 'flex',
              alignItems: 'center',
            }}>
              <Box sx={{ flexGrow: 1 }}>
                <ChatThreadShortListView
                  items={[]}
                  item={thread}
                  mode="view"
                  onView={handleViewThread}
                  onInteraction={handleThreadSelect}
                  onChange={() => null}
                  handleSave={async () => { }}
                />
              </Box>
              <IconButton
                size="small"
                sx={{ ml: 1 }}
                onClick={() => thread._id && handleThreadRemove(thread._id)}
                title="Remove Thread"
              >
                <Delete />
              </IconButton>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
      

      <Accordion
        expanded={expanded === ChatDetailAccordions.THREAD_DETAILS}
        onChange={handleAccordionChange(ChatDetailAccordions.THREAD_DETAILS)}
        sx={{
          flex: expanded === ChatDetailAccordions.THREAD_DETAILS ? 1 : 'none',
          borderRadius: '0 !important',
          margin: '0 !important',
          background: 'none !important',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AccordionSummary
          expandIcon={expanded === ChatDetailAccordions.THREAD_DETAILS ?
            <UnfoldLessIcon /> :
            <OpenInFullIcon />
          }
          sx={{
            background: expanded === ChatDetailAccordions.THREAD_DETAILS ? theme.palette.primary.main : 'transparent',
            minHeight: '0 !important',
            height: '56px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: expanded === ChatDetailAccordions.THREAD_DETAILS 
                ? theme.palette.primary.dark 
                : theme.palette.action.hover,
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
          }}
          disabled={!currentThread}
        >
          <Typography><Info /> Thread Details</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{
          flex: 1,
          overflow: 'auto',
          padding: 0
        }}>
          <ChatThreadCardView
            items={null}
            item={currentThread!}
            mode="view"
            onChange={() => null}
            handleSave={async () => { }}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ActiveChatDetails;