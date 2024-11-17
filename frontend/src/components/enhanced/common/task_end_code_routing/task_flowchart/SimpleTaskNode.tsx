import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { FunctionParameters } from '../../../../../types/ParameterTypes';
import NodeTemplate from './NodeTemplate';

export interface SimpleTaskData {
  task_name: string;
  input_variables: FunctionParameters | null;
  exit_codes: { [key: string]: string };
  onSizeChange: (id: string, width: number, height: number) => void;
}

const SimpleTaskNode: React.FC<NodeProps<SimpleTaskData>> = ({ 
  id,
  data, 
  isConnectable 
}) => {
  const required = new Set(data.input_variables?.required || []);
  const properties = data.input_variables?.properties || {};
  const exitCodes = Object.entries(data.exit_codes || {})
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const inputArea = (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-semibold mb-2">Inputs</div>
      {Object.keys(properties).map((key) => (
        <div 
          key={key}
          className={`text-sm px-2 py-1 rounded ${
            required.has(key) 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {key}
        </div>
      ))}
    </div>
  );

  const outputArea = (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-semibold mb-2">Output</div>
      <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
        {data.task_name}
      </div>
    </div>
  );

  const bottomArea = (
    <div className="grid grid-flow-col auto-cols-fr gap-2">
      {exitCodes.map(([code, description]) => (
        <div key={code} className="flex flex-col items-center">
          <div className="text-xs text-gray-600 mb-1 transform -rotate-90 origin-bottom whitespace-nowrap h-20 flex items-end">
            {description}
          </div>
          <div className="text-sm font-medium">{code}</div>
        </div>
      ))}
    </div>
  );

  return (
    <NodeTemplate
      nodeId={id}
      onSizeChange={data.onSizeChange}
      inputArea={inputArea}
      outputArea={outputArea}
      bottomArea={bottomArea}
      isConnectable={isConnectable}
    />
  );
};

export default memo(SimpleTaskNode);