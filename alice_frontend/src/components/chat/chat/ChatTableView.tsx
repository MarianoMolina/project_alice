import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility, ChevronRight } from '@mui/icons-material';
import { ChatComponentProps } from '../../../utils/ChatTypes';

const ChatTableView: React.FC<ChatComponentProps> = ({
  items,
  isInteractable = false,
  onInteraction,
  onAddChat,
  showHeaders = true,
}) => {
  if (!items) return null;

  return (
    <TableContainer component={Paper}>
      <Table>
        {showHeaders && (
          <TableHead>
            <TableRow>
              <TableCell>Chat Name</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {items.map((chat) => (
            <TableRow key={chat._id}>
              <TableCell>{chat.name}</TableCell>
              <TableCell>{chat.alice_agent?.name || 'N/A'}</TableCell>
              <TableCell>{new Date(chat.createdAt || '').toLocaleString()}</TableCell>
              <TableCell>
                {isInteractable && onInteraction && (
                  <Tooltip title="View Chat">
                    <IconButton onClick={() => onInteraction(chat)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                )}
                {onAddChat && (
                  <Tooltip title="Add Chat">
                    <IconButton onClick={() => onAddChat(chat)}>
                      <ChevronRight />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ChatTableView;