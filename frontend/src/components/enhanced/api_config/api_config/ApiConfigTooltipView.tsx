import React from 'react';
import { AnimatedTooltip } from '../../../ui/aceternity/AnimatedTooltip';
import { ApiName } from '../../../../types/ApiTypes';
import { LaptopMac, Reddit, Google, ColorLens, Edit } from '@mui/icons-material';
import { APIConfig, APIConfigComponentProps } from '../../../../types/ApiConfigTypes';
import { AnthropicIcon, ArxivIcon, AzureIcon, BarkIcon, CohereIcon, GeminiIcon, GroqIcon, LlamaIcon, LMStudioIcon, MistralIcon, OpenAiIcon, WikipediaIcon, WolframAlphaIcon } from '../../../../utils/CustomIcons';

export const apiConfigIcons: Record<ApiName, React.ReactElement> = {
  [ApiName.REDDIT]: <Reddit />,
  [ApiName.GOOGLE_KNOWLEDGE_GRAPH]: <Google />,
  [ApiName.GOOGLE_SEARCH]: <Google />,
  [ApiName.GEMINI]: <GeminiIcon />,
  [ApiName.GROQ]: <GroqIcon />, 
  [ApiName.ANTHROPIC]: <AnthropicIcon />,
  [ApiName.WIKIPEDIA]: <WikipediaIcon />,
  [ApiName.ARXIV]: <ArxivIcon />,
  [ApiName.WOLFRAM_ALPHA]: <WolframAlphaIcon />,
  [ApiName.OPENAI]: <OpenAiIcon />,
  [ApiName.COHERE]: <CohereIcon />,
  [ApiName.LLAMA]: <LlamaIcon />, 
  [ApiName.AZURE]: <AzureIcon />,
  [ApiName.MISTRAL]: <MistralIcon />, 
  [ApiName.LM_STUDIO]: <LMStudioIcon />,
  [ApiName.BARK]: <BarkIcon />,
  [ApiName.PIXART]: <ColorLens />, 
  [ApiName.EXA]: <AzureIcon />,
  [ApiName.CUSTOM]: <Edit />,
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