import React from 'react';
import { AliceChat, ChatComponentProps } from '../../../../types/ChatTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const ChatListView: React.FC<ChatComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    console.log('ChatListView received items:', items);
    const getPrimaryText = (chat: AliceChat) => chat.name;
    const getSecondaryText = (chat: AliceChat) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Created: {new Date(chat.createdAt || '').toLocaleString()}
        </Typography>
    );

    return (
        <EnhancedListView<AliceChat>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add Agent"
            viewTooltip="View Agent"
        />
    );
};

export default ChatListView;