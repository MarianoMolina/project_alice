import React from 'react';
import { UserCheckpoint, UserCheckpointComponentProps } from '../../../../types/UserCheckpointTypes';
import EnhancedShortListView from '../../../common/enhanced_component/ShortListView';

const UserCheckpointShortListView: React.FC<UserCheckpointComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (userCheckpoint: UserCheckpoint) => userCheckpoint.user_prompt.substring(0, 50);
    const getSecondaryText = (userCheckpoint: UserCheckpoint) => userCheckpoint.request_feedback ? 'Requests feedback' : 'No added feedback requested';

    return (
        <EnhancedShortListView<UserCheckpoint>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default UserCheckpointShortListView;