import React from 'react';
import { Tooltip } from '@mui/material';
import { formatCamelCaseString } from '../../../../../utils/StyleUtils';

interface InputAreaProps {
  properties: { [key: string]: any };
  required: Set<string>;
}

export const InputArea: React.FC<InputAreaProps> = ({ properties, required }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="text-xs font-semibold mb-2">Inputs</div>
    {Object.keys(properties).map((key) => (
      <Tooltip key={key} title={`Type: ${properties[key].type}`} arrow>
        <div
          key={key}
          className={`text-sm px-2 py-1 rounded break-words ${required.has(key)
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-600'
            }`}
        >
          {formatCamelCaseString(key)}
        </div>
      </Tooltip>
    ))}
  </div>
);