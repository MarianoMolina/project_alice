import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    IconButton,
    Tooltip
} from '@mui/material';
import { Visibility, ChevronRight } from '@mui/icons-material';
import { AliceChat, ChatComponentProps } from '../../../utils/ChatTypes';

const ChatListView: React.FC<ChatComponentProps> = ({
    items,
    isInteractable = false,
    onInteraction,
    onAddChat,
}) => {
    if (!items) return null;
    return (
        <List>
            {items.map((chat: AliceChat) => (
                <ListItem key={chat._id}>
                    <ListItemText
                        primary={chat.name}
                        secondary={
                            <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                    Agent: {chat.alice_agent?.name || 'N/A'}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                    Created: {new Date(chat.createdAt || '').toLocaleString()}
                                </Typography>
                            </>
                        }
                    />
                    <Box>
                        {onInteraction && (
                            <Tooltip title="View Chat">
                                <IconButton edge="end" onClick={() => onInteraction(chat)}>
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                        )}
                        {onAddChat && (
                            <Tooltip title="Add Chat">
                                <IconButton edge="end" onClick={() => onAddChat(chat)}>
                                    <ChevronRight />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </ListItem>
            ))}
        </List>
    );
};

export default ChatListView;