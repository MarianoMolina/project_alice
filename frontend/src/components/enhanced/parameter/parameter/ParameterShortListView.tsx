import React from 'react';
import { ParameterDefinition, ParameterComponentProps } from '../../../../types/ParameterTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const ParameterShortListView: React.FC<ParameterComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (parameter: ParameterDefinition) => parameter.type;
    const getSecondaryText = (parameter: ParameterDefinition) => parameter.description || 'N/A';

    return (
        <EnhancedShortListView<ParameterDefinition>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default ParameterShortListView;