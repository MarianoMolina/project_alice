import React from 'react';
import { UserInteraction, UserInteractionComponentProps } from '../../../../types/UserInteractionTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const UserInteractionShortListView: React.FC<UserInteractionComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (userInteraction: UserInteraction) => userInteraction.user_prompt.substring(0, 50);
    const getSecondaryText = (userInteraction: UserInteraction) => userInteraction.user_response ? 'User responded' : 'No user response';

    return (
        <EnhancedShortListView<UserInteraction>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default UserInteractionShortListView;