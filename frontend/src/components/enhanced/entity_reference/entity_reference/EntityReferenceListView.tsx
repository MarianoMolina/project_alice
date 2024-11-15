import React from 'react';
import { EntityReference, EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const EntityReferenceListView: React.FC<EntityReferenceComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (entityReference: EntityReference) => entityReference.name ?? '';
    const getSecondaryText = (entityReference: EntityReference) => (
        <Typography component="span" variant="body2" color="textSecondary">
            {entityReference.url}
        </Typography>
    );

    return (
        <EnhancedListView<EntityReference>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select URL Reference"
            viewTooltip="View URL Reference"
            collectionElementString='EntityReference'
        />
    );
};

export default EntityReferenceListView;