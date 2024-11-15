import React from 'react';
import { AnimatedTooltip } from '../../../ui/aceternity/AnimatedTooltip';
import { API, ApiComponentProps, ApiType } from '../../../../types/ApiTypes';
import { LaptopMac, Reddit, Google, Search, Book, RemoveRedEye, Brush, Hearing, RecordVoiceOver, Tag, EditNote, Summarize } from '@mui/icons-material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

const apiIcons: Record<ApiType, React.ReactElement> = {
  [ApiType.LLM_MODEL]: <EditNote />,
  [ApiType.REDDIT_SEARCH]: <Reddit />,
  [ApiType.WIKIPEDIA_SEARCH]: <AutoStoriesIcon />,
  [ApiType.GOOGLE_SEARCH]: <Google />,
  [ApiType.EXA_SEARCH]: <Search />,
  [ApiType.ARXIV_SEARCH]: <Book />,
  [ApiType.GOOGLE_KNOWLEDGE_GRAPH]: <Search />,
  [ApiType.WOLFRAM_ALPHA]: <Summarize />,
  [ApiType.IMG_VISION]: <RemoveRedEye />,
  [ApiType.IMG_GENERATION]: <Brush />,
  [ApiType.SPEECH_TO_TEXT]: <Hearing />,
  [ApiType.TEXT_TO_SPEECH]: <RecordVoiceOver />,
  [ApiType.EMBEDDINGS]: <Tag />,
  [ApiType.REQUESTS]: <Reddit />, // TODO: What to do with this?
};

const getBackgroundColor = (healthStatus: API['health_status']) => {
  switch (healthStatus) {
    case 'healthy':
      return 'bg-green-500';
    case 'unhealthy':
      return 'bg-red-500';
    default:
      return 'bg-yellow-500';
  }
};

const ApiTooltipView: React.FC<ApiComponentProps> = ({ items, onInteraction }) => {
  if (!items) return null;

  const handleClick = (api: API) => {
    if (onInteraction) {
      onInteraction(api);
    }
  };

  const tooltipItems = items.map(api => ({
    id: api._id || '',
    name: api.name,
    designation: api.api_type,
    image: (
      <div
        className={`relative w-full h-full rounded-full flex items-center justify-center ${getBackgroundColor(api.health_status)} cursor-pointer`}
        onClick={() => handleClick(api)}
      >
        {apiIcons[api.api_type] || <LaptopMac />}
        {!api.is_active && (
          <div className="absolute inset-0 bg-gray-800 opacity-50 rounded-full"></div>
        )}
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

export default ApiTooltipView;