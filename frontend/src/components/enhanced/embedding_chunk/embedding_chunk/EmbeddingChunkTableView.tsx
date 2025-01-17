import React from 'react';
import { EmbeddingChunk, EmbeddingChunkComponentProps } from '../../../../types/EmbeddingChunkTypes';
import EnhancedTableView from '../../../common/enhanced_component/TableView';

const EmbeddingChunkTableView: React.FC<EmbeddingChunkComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Text',
      render: (EmbeddingChunk: EmbeddingChunk) => EmbeddingChunk.text_content.substring(0, 50),
      sortKey: 'user_prompt'
    },
    {
      header: 'Index',
      render: (EmbeddingChunk: EmbeddingChunk) => EmbeddingChunk.index.toString(),
      sortKey: 'index'
    },
    {
      header: 'Length',
      render: (EmbeddingChunk: EmbeddingChunk) => EmbeddingChunk.text_content.length,
    },
    {
      header: 'Created At',
      render: (EmbeddingChunk: EmbeddingChunk) => new Date(EmbeddingChunk.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<EmbeddingChunk>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Select User Interaction"
      viewTooltip="View User Interaction"
    />
  );
};

export default EmbeddingChunkTableView;