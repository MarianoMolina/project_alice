import React from 'react';
import { Box, Stack, Typography, Accordion, AccordionSummary, AccordionDetails, Button } from '@mui/material';
import { TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import { NodeReferencesViewer } from '../NodeReferencesViewer';
import { PopulatedReferences } from '../../../../types/ReferenceTypes';
import { ExpandMore, Launch } from '@mui/icons-material';
import { useDialog } from '../../../../contexts/DialogContext';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import ContentStats from '../../../ui/markdown/ContentStats';

interface NodeResponseViewerProps extends TaskResponseComponentProps {
  level?: number;
}

const TaskResponseViewer: React.FC<NodeResponseViewerProps> = ({
  item,
  level = 0
}) => {
  const { selectCardItem } = useDialog();

  const handleViewTaskResponse = () => {
    if (item?._id) {
      selectCardItem('TaskResponse', item._id);
    }
  };

  return (
    <Stack>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          {item?.task_name && (
            <Typography variant="h6">{item.task_name}</Typography>
          )}
          {item?.task_description && (
            <Typography variant="body2" color="text.secondary">{item.task_description}</Typography>
          )}
        </Box>
        <Button
          startIcon={<Launch />}
          onClick={handleViewTaskResponse}
          variant="outlined"
          size="small"
        >
          View Details
        </Button>
      </Box>

      {/* Raw Output Section */}
      {item?.task_outputs && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Raw Output</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ContentStats content={item.task_outputs as string} />
            <AliceMarkdown showCopyButton>{item.task_outputs as string}</AliceMarkdown>
          </AccordionDetails>
        </Accordion>
      )}
      <Accordion disabled={!item?.node_references?.length} defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Node Responses</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {item?.node_references?.map((nodeResponse, index) => (
            <Box key={`${nodeResponse.node_name}-${index}`}>
              <NodeReferencesViewer
                references={nodeResponse.references as PopulatedReferences}
                level={level}
                nodeName={nodeResponse.node_name}
                executionOrder={nodeResponse.execution_order}
                exitCode={nodeResponse.exit_code}
              />
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};

export default TaskResponseViewer;