import React from 'react';
import { AliceModel, ModelComponentProps } from '../../../../types/ModelTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const ModelListView: React.FC<ModelComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (model: AliceModel) => model.model_name as string;
    const getSecondaryText = (model: AliceModel) => (
        <Typography component="span" variant="body2" color="textSecondary">
            API: {model.api_name}
        </Typography>
    );

    return (
        <>
        <EnhancedListView<AliceModel>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add Model"
            viewTooltip="View Model"
            collectionElementString='Model'
        />
        </>
    );
};

export default ModelListView;