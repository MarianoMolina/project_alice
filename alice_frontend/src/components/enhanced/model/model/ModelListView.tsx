import React from 'react';
import { AliceModel, ModelComponentProps } from '../../../../utils/ModelTypes';
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
            Created: {model.deployment}
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
            interactionTooltip="Add Agent"
            viewTooltip="View Agent"
        />
        </>
    );
};

export default ModelListView;