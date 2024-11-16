import React from 'react';
import { Typography, Box } from '@mui/material';
import { API, ApiComponentProps } from '../../../../types/ApiTypes';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { CheckCircle, Cancel } from '@mui/icons-material';

const ApiListView: React.FC<ApiComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (api: API) => `${api.name} (${api.api_type})`;

    const getSecondaryText = (api: API) => (
        <Box display="flex" alignItems="center">
            {api.is_active ? (
                <CheckCircle fontSize="small" color="success" />
            ) : (
                <Cancel fontSize="small" color="error" />
            )}
            <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1, mr: 2 }}>
                {api.is_active ? 'Active' : 'Inactive'}
            </Typography>
        </Box>
    );

    return (
        <EnhancedListView<API>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add Agent"
            viewTooltip="View Agent"
            collectionElementString='API'
        />
    );
};

export default ApiListView;