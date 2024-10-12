import React from 'react';
import { Typography } from '@mui/material';
import { MessageType, MessageComponentProps } from '../../../../types/MessageTypes';
import EnhancedListView from '../../common/enhanced_component/ListView';

const MessageListView: React.FC<MessageComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (message: MessageType) => {
        return `${message.role}: ${message.content.substring(0, 300)}${message.content.length > 300 ? '...' : ''}`;
    };

    const getSecondaryText = (message: MessageType) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Created: {new Date(message.createdAt || '').toLocaleString()} | Type: {message.type || 'text'}
        </Typography>
    );

    return (
        <EnhancedListView<MessageType>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select Message"
            viewTooltip="View Message Details"
            collectionElementString='Message'
        />
    );
};

export default MessageListView;