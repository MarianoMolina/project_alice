import React from 'react';
import { API, ApiComponentProps } from '../../../../types/ApiTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';

const APIShortListView: React.FC<ApiComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (api: API) => api.name ?? 'API';
    const getSecondaryText = (api: API) => `Type: ${formatStringWithSpaces(api.api_type)}`;

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