import React from 'react';
import { AliceChat, ChatComponentProps } from '../../../../types/ChatTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import Logger from '../../../../utils/Logger';

const ChatListView: React.FC<ChatComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    Logger.debug('ChatListView', { items, item });
    const getPrimaryText = (chat: AliceChat) => chat.name;
    const getSecondaryText = (chat: AliceChat) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Agent: {chat.alice_agent.name || 'N/A'} - Messages: {chat.messages.length || 0}
        </Typography>
    );

    return (
        <EnhancedListView<AliceChat>
            items={items as AliceChat[]}
            item={item as AliceChat}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add Chat"
            viewTooltip="View Chat"
            collectionElementString='Chat'
        />
    );
};

export default ChatListView;