import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import NodeTemplate from './NodeTemplate';
import { getNodeAreas } from './shared_nodes/ShareNodes';
import { BaseTaskData } from '../utils/FlowChartUtils';

const SimpleTaskNode: React.FC<NodeProps<BaseTaskData>> = ({
  id,
  data,
  isConnectable
}) => {
  const { inputArea, outputArea, exitCodeArea, contentArea } = getNodeAreas(data);

  return (
    <NodeTemplate
      nodeId={id}
      onSizeChange={data.onSizeChange}
      inputArea={inputArea}
      centerArea={contentArea}
      outputArea={outputArea}
      exitCodeArea={exitCodeArea}
      isConnectable={isConnectable}
    />
  );
};

export default memo(SimpleTaskNode);