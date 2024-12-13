import React from 'react';
import DataClusterListView from './DataClusterListView';
import DataClusterTableView from './DataClusterTableView';
import DataClusterCardView from './DataClusterCardView';
import DataClusterShortListView from './DataClusterShortListView';
import { DataCluster, DataClusterComponentProps, PopulatedDataCluster } from '../../../../types/DataClusterTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import DataClusterFlexibleView from './DataClusterFlexibleView';

type BaseDataClusterMode = BaseDbElementProps<DataCluster>['mode'];
type ExtendedDataClusterMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedDataClusterMode = BaseDataClusterMode | ExtendedDataClusterMode;

interface EnhancedDataClusterProps extends Omit<DataClusterComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedDataClusterMode;
  item?: Partial<DataCluster | PopulatedDataCluster> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: DataCluster | PopulatedDataCluster) => void;
  onDelete?: (deletedItem: DataCluster | PopulatedDataCluster) => Promise<void>;
}

const EnhancedDataCluster: React.FC<EnhancedDataClusterProps> = (props) => {
  const renderContent = (
    items: (DataCluster | PopulatedDataCluster)[] | null,
    item: DataCluster | PopulatedDataCluster | null,
    onChange: (newItem: Partial<DataCluster | PopulatedDataCluster>) => void,
    mode: BaseDataClusterMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: DataCluster | PopulatedDataCluster) => Promise<void>,
  ) => {
    const commonProps: DataClusterComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
      handleDelete: onDelete,
      isInteractable: props.isInteractable,
      onView: props.onView,
      onInteraction: props.onInteraction,
      showHeaders: props.showHeaders,
    };

    switch (props.mode) {
      case 'create':
      case 'edit':
      case 'view':
        return <DataClusterFlexibleView {...commonProps} />;
      case 'card':
        return <DataClusterCardView {...commonProps} />;
      case 'shortList':
        return <DataClusterShortListView {...commonProps} />;
      case 'list':
        return <DataClusterListView {...commonProps}/>;
      case 'table':
        return <DataClusterTableView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<DataCluster>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<DataCluster | PopulatedDataCluster>
      collectionName="dataclusters"
      itemId={props.itemId}
      partialItem={props.item || undefined}
      mode={baseDbMode}
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      onDelete={props.onDelete}
      fetchAll={props.fetchAll}
      render={renderContent}
    />
  );
};

export default EnhancedDataCluster;