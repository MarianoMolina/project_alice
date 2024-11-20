import React from 'react';
import { AliceModel, ModelComponentProps } from '../../../../types/ModelTypes';
import { IconButton, Tooltip, Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { Api } from '@mui/icons-material';
import { apiNameIcons } from '../../../../utils/ApiUtils';

const ModelListView: React.FC<ModelComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (model: AliceModel) => model.short_name as string;
    const getSecondaryText = (model: AliceModel) => (
        <Typography component="span" variant="body2" color="textSecondary">
            <Tooltip title={`API name: ${model.api_name}`}>
                <IconButton size="small">
                    {apiNameIcons[model.api_name] || <Api />}
                </IconButton>
            </Tooltip>
            {model.model_type}
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