import React from 'react';
import { Tooltip } from '@mui/material';
import { OutputType } from '../../../../../types/ReferenceTypes';
import { formatCamelCaseString } from '../../../../../utils/StyleUtils';

interface OutputAreaProps {
  taskName: string;
  outputType: OutputType;
}

export const OutputArea: React.FC<OutputAreaProps> = ({ taskName, outputType }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="text-xs font-semibold mb-2">Output</div>
    <Tooltip title={`Type: ${outputType}`} arrow>
      <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded break-words">
        {formatCamelCaseString(taskName)}
      </div>
    </Tooltip>
  </div>
);
