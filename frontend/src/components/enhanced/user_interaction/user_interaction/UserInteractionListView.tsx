import React from 'react';
import { UserInteraction, UserInteractionComponentProps } from '../../../../types/UserInteractionTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const UserInteractionListView: React.FC<UserInteractionComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (userInteraction: UserInteraction) => userInteraction.user_checkpoint_id.user_prompt.substring(0, 50);
    const getSecondaryText = (userInteraction: UserInteraction) => (
        <Typography component="span" variant="body2" color="textSecondary">
            {userInteraction.user_response ? 'User responded' : 'No user response'}
        </Typography>
    );

    return (
        <EnhancedListView<UserInteraction>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select User Interaction"
            viewTooltip="View User Interaction"
            collectionElementString='UserInteraction'
        />
    );
};

export default UserInteractionListView;