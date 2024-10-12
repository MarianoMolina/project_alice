import React from 'react';
import { URLReference, URLReferenceComponentProps } from '../../../../types/URLReferenceTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const URLReferenceListView: React.FC<URLReferenceComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (urlReference: URLReference) => urlReference.title;
    const getSecondaryText = (urlReference: URLReference) => (
        <Typography component="span" variant="body2" color="textSecondary">
            {urlReference.url}
        </Typography>
    );

    return (
        <EnhancedListView<URLReference>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select URL Reference"
            viewTooltip="View URL Reference"
            collectionElementString='URLReference'
        />
    );
};

export default URLReferenceListView;