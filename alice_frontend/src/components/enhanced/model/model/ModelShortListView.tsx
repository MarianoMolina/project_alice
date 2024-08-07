import React from 'react';
import { AliceModel, ModelComponentProps } from '../../../../types/ModelTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const ModelShortListView: React.FC<ModelComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (model: AliceModel) => model.model_name;
    const getSecondaryText = (model: AliceModel) => model.model_type || 'N/A';

    return (
        <EnhancedShortListView<AliceModel>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default ModelShortListView;