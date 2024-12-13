import React from 'react';
import { EntityReference, EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { Source } from '@mui/icons-material';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';
import { apiTypeIcons } from '../../../../utils/ApiUtils';
import { ApiType } from '../../../../types/ApiTypes';

const EntityReferenceListView: React.FC<EntityReferenceComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (entityReference: EntityReference) => entityReference.name ?? '';
    const getSecondaryText = (entityReference: EntityReference) => (
        <Box>
            <Tooltip title={`API name: ${formatStringWithSpaces(entityReference?.source?.toString() || '')}`}>
                <IconButton size="small">
                    {apiTypeIcons[entityReference?.source as ApiType] || <Source />}
                </IconButton>
            </Tooltip>
            <Typography component="span" variant="body2" color="textSecondary">
                Categories: {entityReference.categories ? entityReference.categories.join(', ') : ''}
            </Typography>
        </Box>
    );

    return (
        <EnhancedListView<EntityReference>
            items={items as EntityReference[]}
            item={item as EntityReference}
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