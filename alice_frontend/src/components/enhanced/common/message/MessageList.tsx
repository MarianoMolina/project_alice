import React, { useMemo } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    IconButton,
    Tooltip,
    Divider
} from '@mui/material';
import { Visibility, Edit } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { MessageType } from '../../../../types/MessageTypes';

const ListItemStyled = styled(ListItem)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 2),
}));

const ContentBox = styled(Box)({
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

const ButtonBox = styled(Box)({
    display: 'flex',
    justifyContent: 'flex-end',
    width: '80px',
});

interface MessageListViewProps {
    messages: MessageType[];
    onView?: (message: MessageType) => void;
    onEdit?: (message: MessageType) => void;
}

const MessageListView: React.FC<MessageListViewProps> = ({ messages, onView, onEdit }) => {
    const sortedMessages = useMemo(() => {
        const sorted = [...messages].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateA - dateB;
        });

        // Check for discrepancies
        messages.forEach((message, index) => {
            if (message !== sorted[index]) {
                console.warn(`Message order discrepancy detected at index ${index}`);
            }
        });

        return sorted;
    }, [messages]);

    const getPrimaryText = (message: MessageType) => {
        return `${message.role}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`;
    };

    const getSecondaryText = (message: MessageType) => {
        return (
            <Typography variant="body2" color="textSecondary">
                {`Created: ${new Date(message.createdAt || 0).toLocaleString()} | Type: ${message.type || 'text'}`}
            </Typography>
        );
    };

    const renderMessage = (message: MessageType) => (
        <React.Fragment key={message._id}>
            <ListItemStyled>
                <ContentBox>
                    <ListItemText
                        primary={getPrimaryText(message)}
                        secondary={getSecondaryText(message)}
                    />
                </ContentBox>
                <ButtonBox>
                    {onView && (
                        <Tooltip title="View Message">
                            <IconButton size="small" onClick={() => onView(message)}>
                                <Visibility />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onEdit && (
                        <Tooltip title="Edit Message">
                            <IconButton size="small" onClick={() => onEdit(message)}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                    )}
                </ButtonBox>
            </ListItemStyled>
            <Divider />
        </React.Fragment>
    );

    if (sortedMessages.length === 0) {
        return <Typography>No messages available.</Typography>;
    }

    return (
        <List>
            {sortedMessages.map(renderMessage)}
        </List>
    );
};

export default MessageListView;