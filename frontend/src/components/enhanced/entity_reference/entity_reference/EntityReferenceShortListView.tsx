import React from 'react';
import { EntityReference, EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';
import EnhancedShortListView from '../../../common/enhanced_component/ShortListView';

const EntityReferenceShortListView: React.FC<EntityReferenceComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (entityReference: EntityReference) => entityReference.name ?? '';
    const getSecondaryText = (entityReference: EntityReference) => entityReference.categories ? entityReference.categories.join(', ') : '';

    return (
        <EnhancedShortListView<EntityReference>
            items={items as EntityReference[]}
            item={item as EntityReference}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default EntityReferenceShortListView;