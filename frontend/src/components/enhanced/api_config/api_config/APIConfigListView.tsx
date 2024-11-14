import React from 'react';
import { APIConfig, APIConfigComponentProps } from '../../../../types/ApiConfigTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const APIConfigListView: React.FC<APIConfigComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (APIConfig: APIConfig) => APIConfig.name;
    const getSecondaryText = (APIConfig: APIConfig) => (
        <Typography component="span" variant="body2" color="textSecondary">
            API Name: {APIConfig.api_name}
        </Typography>
    );

    return (
        <EnhancedListView<APIConfig>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add APIConfig"
            viewTooltip="View APIConfig"
            collectionElementString='APIConfig'
        />
    );
};

export default APIConfigListView;