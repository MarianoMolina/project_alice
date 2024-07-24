import React from 'react';
import { AliceChat, ChatComponentProps } from '../../../../utils/ChatTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const ChatShortListView: React.FC<ChatComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (chat: AliceChat) => chat.name;
    const getSecondaryText = (chat: AliceChat) => chat.alice_agent?.name || 'N/A';

    return (
        <EnhancedShortListView<AliceChat>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default ChatShortListView;