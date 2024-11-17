import React, {  memo } from 'react';
import { NodeProps } from 'reactflow';
import { ApiType } from '../../../../../types/ApiTypes';
import { apiTypeIcons } from '../../../../../utils/ApiUtils';
import NodeTemplate from './NodeTemplate';
import { AliceTask } from '../../../../../types/TaskTypes';


interface TaskNodeData extends AliceTask {
  onSizeChange: (id: string, width: number, height: number) => void;
}

const TaskNode: React.FC<NodeProps<TaskNodeData>> = ({ 
  id,
  data, 
  isConnectable 
}) => {
  const required = new Set(data.input_variables?.required || []);
  const properties = data.input_variables?.properties || {};
  const exitCodes = Object.entries(data.exit_codes || {})
    .sort(([a], [b]) => parseInt(a) - parseInt(b));
  const innerNodes = Object.keys(data.node_end_code_routing || {});

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

  const centerArea = (
    <div className="flex flex-col h-full">
      {data.required_apis && data.required_apis.length > 0 && (
        <div className="flex gap-2 mb-3">
          {data.required_apis.map((api) => (
            <div key={api} className="text-gray-600">
              {React.cloneElement(apiTypeIcons[api as ApiType], { 
                className: 'w-5 h-5' 
              })}
            </div>
          ))}
        </div>
      )}

      {innerNodes.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold mb-1">Nodes</div>
          <div className="flex flex-wrap gap-1">
            {innerNodes.map((node) => (
              <span key={node} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {node}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto text-xs text-gray-500">
        <div>{data.task_type}</div>
        {data.max_attempts && (
          <div>Max attempts: {data.max_attempts}</div>
        )}
      </div>
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
      centerArea={centerArea}
      outputArea={outputArea}
      bottomArea={bottomArea}
      isConnectable={isConnectable}
    />
  );
};

export default memo(TaskNode);