import React from 'react';
import { Box, Stack } from '@mui/material';
import { NodeResponse } from '../../../../types/TaskResponseTypes';
import { NodeReferencesViewer } from './NodeReferencesViewer';

interface NodeResponseViewerProps {
  nodeResponses: NodeResponse[];
  level?: number;
}

const NodeResponsesViewer: React.FC<NodeResponseViewerProps> = ({ 
  nodeResponses, 
  level = 0 
}) => {
  return (
    <Stack>
      {nodeResponses.map((nodeResponse, index) => (
        <Box key={`${nodeResponse.node_name}-${index}`} sx={{'display': 'flex'}}>
          <NodeReferencesViewer
            references={nodeResponse.references}
            level={level}
            nodeName={nodeResponse.node_name}
            executionOrder={nodeResponse.execution_order}
            exitCode={nodeResponse.exit_code}
          />
        </Box>
      ))}
    </Stack>
  );
};

export default NodeResponsesViewer;