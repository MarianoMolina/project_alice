import React from 'react';
import { Typography, Box, IconButton } from '@mui/material';
import { API, ApiComponentProps } from '../../../../types/ApiTypes';
import EnhancedListView from '../../../common/enhanced_component/ListView';
import { CheckCircle, Cancel, Api } from '@mui/icons-material';
import { apiNameIcons, apiTypeIcons } from '../../../../utils/ApiUtils';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';

const ApiListView: React.FC<ApiComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (api: API) => api.name || 'N/A';

    const getSecondaryText = (api: API) => (
        <Box display="flex" alignItems="center">
            <IconButton size="small" title={`API name: ${formatStringWithSpaces(api.api_name)}`}>
                {apiNameIcons[api.api_name] || <Api />}
            </IconButton>
            <IconButton size="small" title={`API type: ${formatStringWithSpaces(api.api_type)}`}>
                {apiTypeIcons[api.api_type] || <Api />}
            </IconButton>
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