// NodeTemplate.tsx
import React, { useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';

interface NodeTemplateProps {
  inputArea?: React.ReactNode;
  centerArea?: React.ReactNode;
  outputArea?: React.ReactNode;
  bottomArea?: React.ReactNode;
  isConnectable?: boolean;
  className?: string;
  nodeId: string;
  onSizeChange: (id: string, width: number, height: number) => void;
}

const NodeTemplate: React.FC<NodeTemplateProps> = ({
  inputArea,
  centerArea,
  outputArea,
  bottomArea,
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
    <div 
      ref={nodeRef}
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      data-nodeid={nodeId}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2"
      />
      
      <div className="grid auto-rows-auto">
        <div className="grid grid-cols-[minmax(100px,auto)_1fr_minmax(100px,auto)]">
          <div className="border-r border-gray-200 p-3 min-h-[100px]">
            {inputArea}
          </div>

          <div className="p-3 min-h-[100px]">
            {centerArea}
          </div>

          <div className="border-l border-gray-200 p-3 min-h-[100px]">
            {outputArea}
          </div>
        </div>

        {bottomArea && (
          <div className="border-t border-gray-200 w-full p-3">
            {bottomArea}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2"
      />
    </div>
  );
};

export default NodeTemplate;