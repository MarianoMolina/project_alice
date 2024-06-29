import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Button,
  Dialog,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { AliceChat, AliceAgent, TaskResponse, AliceTask } from '../../utils/types';
import { Terminal, SupportAgent, Functions, Summarize, ExpandMore } from '@mui/icons-material';
import Agent from '../db_elements/Agent';
import Function from '../db_elements/Function';
import TaskResult from '../db_elements/TaskResult';
import useStyles from '../../styles/SidebarStyles';

interface SidebarProps {
  pastChats: AliceChat[];
  handleSelectChat: (chatId: string) => Promise<void>;
  handleNewChatClick: () => void;
  agents: AliceAgent[];
  currentChatId: string | null;
  currentChat: AliceChat | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  pastChats,
  handleSelectChat,
  handleNewChatClick,
  agents,
  currentChatId,
  currentChat
}) => {
  const classes = useStyles();
  const [selectedAgent, setSelectedAgent] = useState<AliceAgent | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<AliceTask | null>(null);
  const [selectedTaskResult, setSelectedTaskResult] = useState<TaskResponse | null>(null);
  const [openAgentDialog, setOpenAgentDialog] = useState(false);
  const [openFunctionDialog, setOpenFunctionDialog] = useState(false);
  const [openTaskResultDialog, setOpenTaskResultDialog] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<'selectChat' | 'currentChat' | false>('selectChat');

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString();
  };

  const getChatTitle = (chat: AliceChat) => {
    if (chat.name) return chat.name;
    if (chat.messages && chat.messages.length > 0) {
      const firstMessage = chat.messages[0].content;
      return firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
    }
    return `Chat ${formatDate(chat.createdAt)}`;
  };

  const handleAgentClick = (agent: AliceAgent) => {
    setSelectedAgent(agent);
    setOpenAgentDialog(true);
  };

  const handleFunctionClick = (func: AliceTask) => {
    setSelectedFunction(func);
    setOpenFunctionDialog(true);
  };

  const handleTaskResultClick = (taskResult: TaskResponse) => {
    setSelectedTaskResult(taskResult);
    setOpenTaskResultDialog(true);
  };

  const handleCloseAgentDialog = () => {
    setOpenAgentDialog(false);
    setSelectedAgent(null);
  };

  const handleCloseFunctionDialog = () => {
    setOpenFunctionDialog(false);
    setSelectedFunction(null);
  };

  const handleCloseTaskResultDialog = () => {
    setOpenTaskResultDialog(false);
    setSelectedTaskResult(null);
  };

  const handleAccordionChange = (panel: 'selectChat' | 'currentChat') => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const handleSelectChatActivate = (chat_id: string) => {
    handleSelectChat(chat_id);
    setExpandedAccordion('currentChat');
  }

  return (
    <Box className={classes.sidebar}>
      <Box className={classes.accordionsContainer}>
        <Accordion
          expanded={expandedAccordion === 'selectChat'}
          onChange={handleAccordionChange('selectChat')}
          className={classes.accordion}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Select Chat</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordionDetails}>
            <List className={classes.chatsList}>
              {pastChats.map((chat) => (
                <ListItemButton
                  key={chat._id}
                  onClick={() => handleSelectChatActivate(chat._id)}
                  selected={chat._id === currentChatId}
                >
                  <ListItemText
                    primary={getChatTitle(chat)}
                    secondary={formatDate(chat.createdAt)}
                  />
                </ListItemButton>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedAccordion === 'currentChat'}
          onChange={handleAccordionChange('currentChat')}
          disabled={!currentChatId}
          className={classes.accordion}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Current Chat</Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordionDetails}>
            {currentChat && (
              <>
                <Typography variant="caption" className={classes.chatId}>
                  Chat ID: {currentChat._id}
                </Typography>

                <Typography variant="subtitle2" className={classes.sectionTitle}>Agents:</Typography>
                <List>
                  <ListItemButton onClick={() => currentChat.alice_agent && handleAgentClick(currentChat.alice_agent)}>
                    <ListItemIcon><SupportAgent /></ListItemIcon>
                    <ListItemText 
                      primary="Alice Agent"
                      secondary={currentChat.alice_agent?.name || 'N/A'}
                    />
                  </ListItemButton>
                  <ListItemButton onClick={() => currentChat.executor && handleAgentClick(currentChat.executor)}>
                    <ListItemIcon><Terminal /></ListItemIcon>
                    <ListItemText 
                      primary="Execution Agent"
                      secondary={currentChat.executor?.name || 'N/A'}
                    />
                  </ListItemButton>
                </List>
                
                <Typography variant="subtitle2" className={classes.sectionTitle}>Available Functions:</Typography>
                <List>
                  {currentChat.functions && currentChat.functions.length > 0 ? (
                    currentChat.functions.map((func, index) => (
                      <ListItemButton key={index} onClick={() => handleFunctionClick(func)}>
                        <ListItemIcon><Functions /></ListItemIcon>
                        <ListItemText primary={func.task_name} />
                      </ListItemButton>
                    ))
                  ) : (
                    <Typography variant="body2" className={classes.fallbackText}>
                      No functions available
                    </Typography>
                  )}
                </List>
                
                <Typography variant="subtitle2" className={classes.sectionTitle}>Task Responses:</Typography>
                <List>
                  {currentChat.task_responses && currentChat.task_responses.length > 0 ? (
                    currentChat.task_responses.map((response: TaskResponse, index: number) => (
                      <ListItemButton key={index} onClick={() => handleTaskResultClick(response)}>
                        <ListItemIcon><Summarize /></ListItemIcon>
                        <ListItemText 
                          primary={response.task_name}
                          secondary={`Status: ${response.status}, Code: ${response.result_code}`}
                        />
                      </ListItemButton>
                    ))
                  ) : (
                    <Typography variant="body2" className={classes.fallbackText}>
                      No task responses yet
                    </Typography>
                  )}
                </List>
              </>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box className={classes.newChatButtonContainer}>
        <Button
          className={classes.newChatButton}
          variant="contained"
          onClick={handleNewChatClick}
        >
          New Chat
        </Button>
      </Box>

      <Dialog open={openAgentDialog} onClose={handleCloseAgentDialog} fullWidth maxWidth="sm">
        <Agent agentId={selectedAgent?._id} onClose={handleCloseAgentDialog} />
      </Dialog>

      <Dialog open={openFunctionDialog} onClose={handleCloseFunctionDialog} fullWidth maxWidth="sm">
        <Function functionId={selectedFunction?._id} onClose={handleCloseFunctionDialog} viewOnly={true} />
      </Dialog>

      <Dialog open={openTaskResultDialog} onClose={handleCloseTaskResultDialog} fullWidth maxWidth="sm">
        <TaskResult taskResponse={selectedTaskResult!} />
      </Dialog>
    </Box>
  );
};

export default Sidebar;