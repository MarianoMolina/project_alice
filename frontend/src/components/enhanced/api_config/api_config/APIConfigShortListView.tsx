import React from 'react';
import { APIConfig, APIConfigComponentProps } from '../../../../types/ApiConfigTypes';
import EnhancedShortListView from '../../../common/enhanced_component/ShortListView';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';

const APIConfigShortListView: React.FC<APIConfigComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (APIConfig: APIConfig) => APIConfig.name;
    const getSecondaryText = (APIConfig: APIConfig) => `Name: ${formatStringWithSpaces(APIConfig.api_name)}` || 'N/A';

    return (
        <EnhancedShortListView<APIConfig>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default APIConfigShortListView;