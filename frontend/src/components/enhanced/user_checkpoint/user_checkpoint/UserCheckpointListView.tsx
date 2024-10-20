import React from 'react';
import { UserCheckpoint, UserCheckpointComponentProps } from '../../../../types/UserCheckpointTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const UserCheckpointListView: React.FC<UserCheckpointComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (userCheckpoint: UserCheckpoint) => userCheckpoint.user_prompt.substring(0, 50);
    const getSecondaryText = (userCheckpoint: UserCheckpoint) => (
        <Typography component="span" variant="body2" color="textSecondary">
            {userCheckpoint.request_feedback ? 'Requests feedback' : 'No added feedback requested'}
        </Typography>
    );

    return (
        <EnhancedListView<UserCheckpoint>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select User Checkpoint"
            viewTooltip="View User Checkpoint"
            collectionElementString='UserCheckpoint'
        />
    );
};

export default UserCheckpointListView;