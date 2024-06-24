import React from 'react';
import { Box, List, ListItem, ListItemText, Typography, Button } from '@mui/material';
import { AliceChat, AliceAgent } from '../utils/types';

interface SidebarProps {
  pastChats: AliceChat[];
  handleSelectChat: (chat: AliceChat | null) => Promise<void>;
  agents: AliceAgent[];
}

const Sidebar: React.FC<SidebarProps> = ({ pastChats, handleSelectChat, agents }) => {
  return (
    <Box sx={{ width: 240, bgcolor: 'background.paper', height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ p: 2 }}>Chats</Typography>
      <List>
        <Button variant="contained" onClick={() => handleSelectChat(null)}>
          <ListItemText primary="New Chat" />
        </Button>
        {pastChats.map((chat) => (
          <ListItem button key={chat._id} onClick={() => handleSelectChat(chat)}>
            <ListItemText primary={chat.createdAt} />
          </ListItem>
        ))}
      </List>
      <Typography variant="h6" sx={{ p: 2 }}>Agents</Typography>
      <List>
        {agents.map((agent, index) => (
          <ListItem key={index}>
            <ListItemText primary={agent.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
