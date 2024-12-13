import React from 'react';
import { DataCluster, DataClusterComponentProps } from '../../../../types/DataClusterTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';
import { howManyReferences } from '../../../../types/ReferenceTypes';

const DataClusterShortListView: React.FC<DataClusterComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (dataCluster: DataCluster) => dataCluster.createdAt ? new Date(dataCluster.createdAt).toLocaleString() : '';
    const getSecondaryText = (dataCluster: DataCluster) => howManyReferences(dataCluster).toString();

    return (
        <EnhancedShortListView<DataCluster>
            items={items as DataCluster[]}
            item={item as DataCluster}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default DataClusterShortListView;