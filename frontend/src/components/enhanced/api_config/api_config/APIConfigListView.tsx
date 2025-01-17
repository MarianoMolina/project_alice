import React from 'react';
import { APIConfig, APIConfigComponentProps } from '../../../../types/ApiConfigTypes';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import EnhancedListView from '../../../common/enhanced_component/ListView';
import { Api, CheckCircle, Error, Warning } from '@mui/icons-material';
import { apiNameIcons } from '../../../../utils/ApiUtils';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';

const APIConfigListView: React.FC<APIConfigComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (apiConfig: APIConfig) => apiConfig.name;
    const getSecondaryText = (apiConfig: APIConfig) => (
        <Box display="flex" alignItems="center">
            <Tooltip title={`API name: ${formatStringWithSpaces(apiConfig.api_name)}`}>
                <IconButton size="small">
                    {apiNameIcons[apiConfig.api_name] || <Api />}
                </IconButton>
            </Tooltip>
            {getHealthIcon(apiConfig.health_status)}
            <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                {apiConfig.health_status}
            </Typography>
        </Box>
    );

    const getHealthIcon = (health: string) => {
        switch (health.toLowerCase()) {
            case 'healthy':
                return <CheckCircle fontSize="small" color="success" />;
            case 'warning':
                return <Warning fontSize="small" color="warning" />;
            case 'error':
                return <Error fontSize="small" color="error" />;
            default:
                return null;
        }
    };

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