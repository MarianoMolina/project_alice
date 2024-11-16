import React from 'react';
import { AnimatedTooltip } from '../../../ui/aceternity/AnimatedTooltip';
import { ApiName } from '../../../../types/ApiTypes';
import { LaptopMac, Reddit, Google, Search, Book, RemoveRedEye, Brush, Hearing, RecordVoiceOver, Tag, EditNote, Summarize } from '@mui/icons-material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { APIConfig, APIConfigComponentProps } from '../../../../types/ApiConfigTypes';

const apiConfigIcons: Record<ApiName, React.ReactElement> = {
  [ApiName.REDDIT]: <Reddit />,
  [ApiName.WIKIPEDIA]: <AutoStoriesIcon />,
  [ApiName.GOOGLE_SEARCH]: <Google />,
  [ApiName.EXA]: <Search />,
  [ApiName.ARXIV]: <Book />,
  [ApiName.GOOGLE_KNOWLEDGE_GRAPH]: <Search />,
  [ApiName.WOLFRAM_ALPHA]: <Summarize />,
  [ApiName.OPENAI]: <EditNote />,
  [ApiName.ANTHROPIC]: <RemoveRedEye />,
  [ApiName.AZURE]: <Brush />,
  [ApiName.BARK]: <Hearing />,
  [ApiName.COHERE]: <RecordVoiceOver />,
  [ApiName.GEMINI]: <Tag />,
  [ApiName.GROQ]: <Reddit />, 
  [ApiName.PIXART]: <Reddit />, 
  [ApiName.MISTRAL]: <Reddit />, 
  [ApiName.LLAMA]: <Reddit />, 
  [ApiName.LM_STUDIO]: <Reddit />,
  [ApiName.CUSTOM]: <Reddit />,
};

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
        {apiConfigIcons[apiConfig.api_name] || <LaptopMac />}
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