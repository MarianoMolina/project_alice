import React from 'react';
import { ParameterDefinition, ParameterComponentProps } from '../../../../types/ParameterTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../../common/enhanced_component/ListView';

const ParameterListView: React.FC<ParameterComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (parameter: ParameterDefinition) => parameter.type;
    const getSecondaryText = (parameter: ParameterDefinition) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Description: {parameter.description}
        </Typography>
    );

    return (
        <EnhancedListView<ParameterDefinition>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add Parameter"
            viewTooltip="View Parameter"
            collectionElementString='Parameter'
        />
    );
};

export default ParameterListView;