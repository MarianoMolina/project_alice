import React from 'react';
import { Drawer, List, ListItem, ListItemText, Typography, Box } from '@mui/material';

interface Chat {
  id: number;
  name: string;
}

interface SidebarProps {
  pastChats: Chat[];
  handleSelectChat: (chat: Chat) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ pastChats, handleSelectChat }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box', top: 64 },
      }}
    >
      <Box sx={{ mt: 8 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Past Chats
        </Typography>
        <List>
          {pastChats.map((chat) => (
            <ListItem button key={chat.id} onClick={() => handleSelectChat(chat)}>
              <ListItemText primary={chat.name} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
