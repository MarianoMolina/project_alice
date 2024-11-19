import React from 'react';
import { Tooltip } from '@mui/material';

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