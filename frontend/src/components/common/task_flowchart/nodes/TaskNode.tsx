import React, { memo, useMemo } from 'react';
import { NodeProps } from 'reactflow';
import { ApiType } from '../../../../types/ApiTypes';
import { apiTypeIcons } from '../../../../utils/ApiUtils';
import NodeTemplate from './NodeTemplate';
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getNodeAreas } from './shared_nodes/ShareNodes';
import { TaskNodeData } from '../utils/FlowChartUtils';
import theme from '../../../../Theme';
import { useDialog } from '../../../../contexts/DialogContext';
import { DataObject, ExpandMore } from '@mui/icons-material';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';

const TaskNode: React.FC<NodeProps<TaskNodeData>> = ({
  id,
  data,
  isConnectable
}) => {
  const { inputArea, outputArea, exitCodeArea } = getNodeAreas(data);
  const innerNodes = Object.keys(data.node_end_code_routing || {});
  const { selectCardItem, selectPromptParsedDialog } = useDialog();
  const handleViewTask = (event: React.MouseEvent) => {
    event.stopPropagation();
    selectCardItem('Task', data._id, data);
  };
  const taskTemplate = useMemo(() =>
    data?.templates?.task_template || undefined
    , [data?.templates]);

  const systemTemplate = useMemo(() =>
    data?.agent?.system_message || undefined
    , [data?.agent]);


  const handleViewPrompt = (event: React.MouseEvent) => {
    event.stopPropagation();
    taskTemplate && selectPromptParsedDialog(taskTemplate, systemTemplate);
  };

  const centerArea = (
    <Stack
      spacing={0.5}
      divider={<Divider flexItem />}
      sx={{
        width: '100%',
        p: 1,
      }}
    >
      {/* Task Name and View Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 1
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: theme.palette.primary.dark,
            flex: 1,
            textAlign: 'center',
            // Ensure text doesn't overflow
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {formatCamelCaseString(data.task_name)}
        </Typography>
        <IconButton
          size="small"
          title="View task template with inputs"
          onClick={handleViewPrompt}
          sx={{
            color: theme.palette.primary.dark,
            flexShrink: 0,
            '&:hover': {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.action.hover,
            }
          }}
        >
          <DataObject fontSize="small" />
        </IconButton>
          <IconButton
            size="small"
            title="View task details"
            onClick={handleViewTask}
            sx={{
              color: theme.palette.primary.dark,
              flexShrink: 0,
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
      </Box>
      <Accordion
        sx={{
          backgroundColor: theme.palette.secondary.light,
          color: theme.palette.primary.dark,
          borderRadius: theme.shape.borderRadius
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="prompt-content"
          id="prompt-content-header"
        >
          <Typography>Details</Typography>
        </AccordionSummary>
        <AccordionDetails>

          {/* Task Type */}
          <Stack spacing={0.5} alignItems="center">
            <Typography variant="caption" color={theme.palette.secondary.contrastText} fontWeight={'bold'}>
              Task Type
            </Typography>
            <Chip
              label={data.task_type}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.dark,
                color: theme.palette.secondary.light,
                fontSize: '0.75rem'
              }}
            />
          </Stack>

          {/* Required APIs */}
          {data.required_apis && data.required_apis.length > 0 && (
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="caption" color={theme.palette.secondary.contrastText} fontWeight={'bold'}>
                Required APIs
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center">
                {data.required_apis.map((api) => (
                  <Tooltip key={api} title={`${api}`} arrow>
                    <Box sx={{ color: theme.palette.primary.dark }}>
                      {React.cloneElement(apiTypeIcons[api as ApiType], {
                        sx: { width: 20, height: 20 }
                      })}
                    </Box>
                  </Tooltip>
                ))}
              </Stack>
            </Stack>
          )}

          {/* Inner Nodes */}
          {innerNodes.length > 0 && (
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="caption" color={theme.palette.secondary.contrastText} fontWeight={'bold'}>
                Inner Nodes
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center">
                {innerNodes.map((node) => (
                  <Chip
                    key={node}
                    label={node}
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.secondary.dark,
                      color: theme.palette.primary.dark,
                      fontSize: '0.75rem'
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          )}

          {/* Max Attempts */}
          {data.max_attempts && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.secondary.contrastText,
                textAlign: 'center',
                display: 'block'
              }}
            >
              <b>Max Attempts:</b> {data.max_attempts}
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Stack>
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

export default memo(TaskNode);