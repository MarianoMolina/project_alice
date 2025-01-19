import React from 'react';
import { AliceModel, ModelComponentProps } from '../../../../types/ModelTypes';
import { IconButton, Typography } from '@mui/material';
import EnhancedListView from '../../../common/enhanced_component/ListView';
import { Api } from '@mui/icons-material';
import { apiNameIcons, modelTypeIcons } from '../../../../utils/ApiUtils';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';

const ModelListView: React.FC<ModelComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (model: AliceModel) => model.short_name as string;
    const getSecondaryText = (model: AliceModel) => (
        <Typography component="span" variant="body2" color="textSecondary">
            <IconButton size="small" title={`API name: ${formatCamelCaseString(model.api_name)}`}>
                {apiNameIcons[model.api_name] || <Api />}
            </IconButton>
            <IconButton size="small" title={`Model type: ${formatCamelCaseString(model.model_type)}`}>
                {modelTypeIcons[model.model_type] || <Api />}
            </IconButton>
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