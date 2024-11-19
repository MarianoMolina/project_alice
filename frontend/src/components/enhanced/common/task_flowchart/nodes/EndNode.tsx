import React, { memo, useEffect, useRef } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import theme from '../../../../../Theme';
import { hexToRgba } from '../../../../../utils/StyleUtils';

const EndNode: React.FC<NodeProps<{ onSizeChange: (id: string, width: number, height: number) => void }>> = ({
  id,
  data,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      data.onSizeChange(id, width, height);
    }
  }, [id, data]);

  return (
    <div
      ref={ref}
      style={{
        padding: '10px',
        border: `2px solid ${theme.palette.primary.main}`,
        backgroundColor: hexToRgba(theme.palette.primary.main, 0.8),
        borderRadius: '4px',
        textAlign: 'center',
        fontWeight: 'bold',
      }}
      data-id={id} // Ensure ReactFlow recognizes the node ID
    >
      End
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(EndNode);
