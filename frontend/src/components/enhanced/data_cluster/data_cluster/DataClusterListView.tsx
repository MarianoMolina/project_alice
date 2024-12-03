import React from 'react';
import { DataCluster, DataClusterComponentProps } from '../../../../types/DataClusterTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { howManyReferences } from '../../../../types/ReferenceTypes';

const DataClusterListView: React.FC<DataClusterComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (dataCluster: DataCluster) => dataCluster.createdAt ? new Date(dataCluster.createdAt).toLocaleString() : '';
    const getSecondaryText = (dataCluster: DataCluster) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Total references: {howManyReferences(dataCluster).toString()}
        </Typography>
    );

    return (
        <EnhancedListView<DataCluster>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select User Interaction"
            viewTooltip="View User Interaction"
            collectionElementString='DataCluster'
        />
    );
};

export default DataClusterListView;