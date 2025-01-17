import React from 'react';
import EnhancedShortListView from '../../../common/enhanced_component/ShortListView';
import { ChatThread, ChatThreadComponentProps } from '../../../../types/ChatThreadTypes';

const ChatThreadShortListView: React.FC<ChatThreadComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (chat: ChatThread) => chat.name || 'Thread (no name)';
    const getSecondaryText = (chat: ChatThread) => `Msg: ${chat.messages.length || 0}`;

    return (
        <EnhancedShortListView<ChatThread>
            items={items as ChatThread[]}
            item={item as ChatThread}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default ChatThreadShortListView;