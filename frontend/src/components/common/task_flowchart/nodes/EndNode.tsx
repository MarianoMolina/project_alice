import React, { memo, useEffect, useRef } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Box, IconButton, Tooltip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import theme from '../../../../Theme';
import { hexToRgba } from '../../../../utils/StyleUtils';
import { useDialog } from '../../../../contexts/DialogContext';
import { Prompt } from '../../../../types/PromptTypes';

interface EndNodeData {
  onSizeChange: (id: string, width: number, height: number) => void;
  output_template?: Prompt;
}

const EndNode: React.FC<NodeProps<EndNodeData>> = ({
  id,
  data,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { selectCardItem } = useDialog();

  useEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      data.onSizeChange(id, width, height);
    }
  }, [id, data]);

  const handleViewTemplate = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (data.output_template) {
      selectCardItem('Prompt', data.output_template._id, data.output_template);
    }
  };

  return (
    <div
      ref={ref}
      style={{
        padding: '10px',
        border: `2px solid ${theme.palette.primary.main}`,
        backgroundColor: hexToRgba(theme.palette.primary.main, 0.8),
        borderRadius: '4px',
        minWidth: '80px',
      }}
      data-id={id}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          color: theme.palette.primary.contrastText,
          fontWeight: 'bold',
        }}
      >
        End
        {data.output_template && (
          <Tooltip title="View Output Template" arrow>
            <IconButton
              size="small"
              onClick={handleViewTemplate}
              sx={{
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: hexToRgba(theme.palette.primary.contrastText, 0.1),
                },
              }}
            >
              <DescriptionIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(EndNode);