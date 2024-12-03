import React from 'react';
import { AnimatedTooltip } from '../../../ui/aceternity/AnimatedTooltip';
import { LaptopMac } from '@mui/icons-material';
import { APIConfig, APIConfigComponentProps } from '../../../../types/ApiConfigTypes';
import { apiNameIcons } from '../../../../utils/ApiUtils';

const getBackgroundColor = (healthStatus: APIConfig['health_status']) => {
  switch (healthStatus) {
    case 'healthy':
      return 'bg-green-500';
    case 'unhealthy':
      return 'bg-red-500';
    default:
      return 'bg-yellow-500';
  }
};

const ApiConfigTooltipView: React.FC<APIConfigComponentProps> = ({ items, onInteraction }) => {
  if (!items) return null;

  const handleClick = (apiConfig: APIConfig) => {
    if (onInteraction) {
      onInteraction(apiConfig);
    }
  };

  const tooltipItems = items.map(apiConfig => ({
    id: apiConfig._id || '',
    name: apiConfig.name,
    designation: apiConfig.api_name,
    image: (
      <div
        className={`relative w-full h-full rounded-full flex items-center justify-center ${getBackgroundColor(apiConfig.health_status)} cursor-pointer`}
        onClick={() => handleClick(apiConfig)}
      >
        {apiNameIcons[apiConfig.api_name] || <LaptopMac />}
      </div>
    ),
  }));

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-row items-center justify-center mb-4 w-fit">
        <AnimatedTooltip items={tooltipItems} />
      </div>
    </div>
  );
};

export default ApiConfigTooltipView;