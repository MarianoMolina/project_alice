import React from 'react';
import EmbeddingChunkListView from './EmbeddingChunkListView';
import EmbeddingChunkTableView from './EmbeddingChunkTableView';
import EmbeddingChunkCardView from './EmbeddingChunkCardView';
import EmbeddingChunkShortListView from './EmbeddingChunkShortListView';
import { EmbeddingChunk, EmbeddingChunkComponentProps } from '../../../../types/EmbeddingChunkTypes';
import BaseDbElement, { BaseDbElementProps } from '../../../common/enhanced_component/BaseDbElement';

type BaseEmbeddingChunkMode = BaseDbElementProps<EmbeddingChunk>['mode'];
type ExtendedEmbeddingChunkMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedEmbeddingChunkMode = BaseEmbeddingChunkMode | ExtendedEmbeddingChunkMode;

interface EnhancedEmbeddingChunkProps extends Omit<EmbeddingChunkComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedEmbeddingChunkMode;
  item?: Partial<EmbeddingChunk> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: EmbeddingChunk) => void;
  onDelete?: (deletedItem: EmbeddingChunk) => Promise<void>;
}

const EnhancedEmbeddingChunk: React.FC<EnhancedEmbeddingChunkProps> = (props) => {
  const renderContent = (
    items: EmbeddingChunk[] | null,
    item: EmbeddingChunk | null,
    onChange: (newItem: Partial<EmbeddingChunk>) => void,
    mode: BaseEmbeddingChunkMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: EmbeddingChunk) => Promise<void>,
  ) => {
    const commonProps: EmbeddingChunkComponentProps = {
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
      case 'card':
        return <EmbeddingChunkCardView {...commonProps} />;
      case 'shortList':
        return <EmbeddingChunkShortListView {...commonProps} />;
      case 'list':
        return <EmbeddingChunkListView {...commonProps}/>;
      case 'table':
        return <EmbeddingChunkTableView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<EmbeddingChunk>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<EmbeddingChunk>
      collectionName="embeddingchunks"
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

export default EnhancedEmbeddingChunk;