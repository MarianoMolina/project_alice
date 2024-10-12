import React from 'react';
import { Typography, Box } from '@mui/material';
import { API, ApiComponentProps } from '../../../../types/ApiTypes';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { CheckCircle, Cancel, Error, Warning } from '@mui/icons-material';

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
            {getHealthIcon(api.health_status)}
            <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                {api.health_status}
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