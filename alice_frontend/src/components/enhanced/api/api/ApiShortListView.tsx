import React from 'react';
import { API, ApiComponentProps } from '../../../../utils/ApiTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const APIShortListView: React.FC<ApiComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (api: API) => api.name;
    const getSecondaryText = (api: API) => api.api_type;

    return (
        <EnhancedShortListView<API>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default APIShortListView;