import React from 'react';
import {  Box, Stack } from '@mui/material';
import { TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import { NodeReferencesViewer } from '../NodeReferencesViewer';
interface NodeResponseViewerProps extends TaskResponseComponentProps {
  level?: number;
}

const TaskResponseViewer: React.FC<NodeResponseViewerProps> = ({
  item,
  level = 0
}) => {
  return (
    <Stack>
      {item?.node_references?.map((nodeResponse, index) => (
            <Box key={`${nodeResponse.node_name}-${index}`} sx={{ 'display': 'flex' }}>
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

export default TaskResponseViewer;