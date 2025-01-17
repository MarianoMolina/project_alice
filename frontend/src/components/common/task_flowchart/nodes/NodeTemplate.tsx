import { Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import theme from '../../../../Theme';

interface NodeTemplateProps {
  inputArea?: React.ReactNode;
  centerArea?: React.ReactNode;
  outputArea?: React.ReactNode;
  exitCodeArea?: React.ReactNode;
  isConnectable?: boolean;
  className?: string;
  nodeId: string;
  onSizeChange: (id: string, width: number, height: number) => void;
}

const NodeTemplate: React.FC<NodeTemplateProps> = ({
  inputArea,
  centerArea,
  outputArea,
  exitCodeArea,
  isConnectable = true,
  className = '',
  nodeId,
  onSizeChange
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!nodeRef.current) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        onSizeChange(
          nodeId,
          entry.contentRect.width,
          entry.contentRect.height
        );
      }
    });

    observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [nodeId, onSizeChange]);

  return (
    <Box 
      ref={nodeRef}
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      color={theme.palette.primary.dark}
      data-nodeid={nodeId}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2"
      />
      
      <div className="grid grid-cols-[160px_300px_160px] min-h-[150px]">
        <div className="border-r border-gray-200 flex items-center">
          <div className="w-full px-3">
            {inputArea}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex-1 flex items-center justify-center px-3">
            {centerArea}
          </div>
          <div className="border-t border-gray-200 pt-2">
            {exitCodeArea}
          </div>
        </div>

        <div className="border-l border-gray-200 flex items-center">
          <div className="w-full px-3 text-right">
            {outputArea}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2"
      />
    </Box>
  );
};

export default NodeTemplate;