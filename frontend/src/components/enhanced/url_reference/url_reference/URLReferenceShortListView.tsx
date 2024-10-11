import React from 'react';
import { URLReference, URLReferenceComponentProps } from '../../../../types/URLReferenceTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const URLReferenceShortListView: React.FC<URLReferenceComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (urlReference: URLReference) => urlReference.title;
    const getSecondaryText = (urlReference: URLReference) => urlReference.url;

    return (
        <EnhancedShortListView<URLReference>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default URLReferenceShortListView;