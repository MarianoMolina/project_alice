import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import NodeTemplate from './NodeTemplate';
import { getNodeAreas } from './ShareNodes';
import { BaseTaskData } from '../utils/FlowChartUtils';
import { Box, Typography } from '@mui/material';
import theme from '../../../../../Theme';

const SimpleTaskNode: React.FC<NodeProps<BaseTaskData>> = ({
  id,
  data,
  isConnectable
}) => {
  const { inputArea, outputArea, exitCodeArea } = getNodeAreas(data);
  const centerArea = (
    <Box className="w-full text-center">
      <Typography 
      className="text-sm"
      color={theme.palette.primary.dark}
        >
          {data.task_name}</Typography>
    </Box>
  );

  return (
    <NodeTemplate
      nodeId={id}
      onSizeChange={data.onSizeChange}
      inputArea={inputArea}
      centerArea={centerArea}
      outputArea={outputArea}
      exitCodeArea={exitCodeArea}
      isConnectable={isConnectable}
    />
  );
};

export default memo(SimpleTaskNode);