import React from 'react';
import { Tooltip } from '@mui/material';
import { BaseTaskData } from '../utils/FlowChartUtils';

interface InputAreaProps {
  properties: { [key: string]: any };
  required: Set<string>;
}

export const InputArea: React.FC<InputAreaProps> = ({ properties, required }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="text-xs font-semibold mb-2">Inputs</div>
    {Object.keys(properties).map((key) => (
      <div
        key={key}
        className={`text-sm px-2 py-1 rounded break-words ${
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

interface OutputAreaProps {
  taskName: string;
}

export const OutputArea: React.FC<OutputAreaProps> = ({ taskName }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="text-xs font-semibold mb-2">Output</div>
    <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded break-words">
      {taskName}
    </div>
  </div>
);

interface ExitCodeAreaProps {
  exitCodes: [string, string][];
}

export const ExitCodeArea: React.FC<ExitCodeAreaProps> = ({ exitCodes }) => {
  const getExitCodeColor = (code: string) => {
    const codeNum = parseInt(code);
    if (codeNum === 0) return 'bg-green-500 text-white';
    if (codeNum === 1) return 'bg-red-500 text-white';
    return 'bg-blue-500 text-white';
  };

  return (
    <div className="flex justify-center gap-2">
      {exitCodes.map(([code, description]) => (
        <Tooltip
          key={code}
          title={description}
          arrow
          placement="top"
        >
          <div 
            className={`w-6 h-6 rounded flex items-center justify-center font-semibold cursor-help shadow-sm hover:shadow-md transition-shadow ${getExitCodeColor(code)}`}
          >
            {code}
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

export const getNodeAreas = (data: BaseTaskData) => {
  const required = new Set(data.input_variables?.required || []);
  const properties = data.input_variables?.properties || {};
  const exitCodes = Object.entries(data.exit_codes || {})
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  return {
    inputArea: <InputArea properties={properties} required={required} />,
    outputArea: <OutputArea taskName={data.task_name} />,
    exitCodeArea: <ExitCodeArea exitCodes={exitCodes} />,
  };
};