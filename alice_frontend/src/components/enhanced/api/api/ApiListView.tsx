import { Typography } from '@mui/material';
import { API, ApiComponentProps } from '../../../../types/ApiTypes';
import EnhancedListView from '../../common/enhanced_component/ListView';

const ApiListView: React.FC<ApiComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (api: API) => `Type: ${api.api_type as string} - ${api.name} `;
    const getSecondaryText = (api: API) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Status: {api.is_active ? 'Active' : 'Inactive'} - Health: {api.health_status}
        </Typography>
    );

    return (
        <>
        <EnhancedListView<API>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add Agent"
            viewTooltip="View Agent"
        />
        </>
    );
};

export default ApiListView;