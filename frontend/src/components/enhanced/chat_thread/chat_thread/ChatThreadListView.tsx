import React from 'react';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import Logger from '../../../../utils/Logger';
import { ChatThread, ChatThreadComponentProps } from '../../../../types/ChatThreadTypes';

const ChatThreadListView: React.FC<ChatThreadComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (chat: ChatThread) => chat.name || 'Thread (no name)';
    const getSecondaryText = (chat: ChatThread) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Messages: {chat.messages.length || 0}
        </Typography>
    );

    return (
        <EnhancedListView<ChatThread>
            items={items as ChatThread[]}
            item={item as ChatThread}
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

export default ChatThreadListView;