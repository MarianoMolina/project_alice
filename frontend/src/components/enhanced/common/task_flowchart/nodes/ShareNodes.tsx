import React from 'react';
import { Tooltip } from '@mui/material';
import { BaseTaskData } from '../utils/FlowChartUtils';
import { Box, Accordion, AccordionDetails, AccordionSummary, Chip, Stack, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { ApiType } from '../../../../../types/ApiTypes';
import { FunctionParameters } from '../../../../../types/ParameterTypes';
import { TaskType } from '../../../../../types/TaskTypes';
import { apiTypeIcons } from '../../../../../utils/ApiUtils';
import theme from '../../../../../Theme';
import { useCardDialog } from '../../../../../contexts/CardDialogContext';
import { CollectionElement, CollectionElementString } from '../../../../../types/CollectionTypes';

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

// Node type mappings
interface NodeConfig {
  getInputs?: (data: BaseTaskData) => FunctionParameters | null;
  getContent?: (data: BaseTaskData, selectCardItem: (type: CollectionElementString, id?: string, data?: CollectionElement) => void) => React.ReactNode;
  getOutputType: () => string;
  requiredApis: ApiType[];
}

// Define a type for our node definitions to handle the readonly arrays
type NodeDefinition = {
  getInputs?: (data: BaseTaskData) => FunctionParameters | null;
  getContent?: (data: BaseTaskData, selectCardItem: (type: CollectionElementString, id?: string, data?: CollectionElement) => void) => React.ReactNode;
  getOutputType: () => string;
  requiredApis: ApiType[];
};

// Reusable node definitions with proper typing
const NODE_DEFINITIONS: { [key: string]: NodeDefinition } = {
  llm_generation: {
    getInputs: (data: BaseTaskData) => data.templates?.['task_template']?.parameters || null,
    getContent: (data: BaseTaskData, selectCardItem: (type: CollectionElementString, id?: string, data?: CollectionElement) => void) => (
      <Stack spacing={1}>
        {['agent_system_message', 'task_template', 'output_template'].map(templateName => {
          const template = templateName === 'agent_system_message' ? data.agent?.system_message : data.templates?.[templateName];
          return (
            <Chip
              key={templateName}
              label={templateName}
              onClick={template && template._id ? () => selectCardItem('Prompt', template._id, template) : undefined}
              sx={{
                backgroundColor: template ? theme.palette.secondary.main : theme.palette.grey[300],
                cursor: template && template._id ? 'pointer' : 'default',
                color: template ? theme.palette.primary.dark : theme.palette.grey[600]
              }}
            />
          );
        })}
      </Stack>
    ),
    getOutputType: () => 'Message',
    requiredApis: [ApiType.LLM_MODEL]
  },

  tool_call_execution: {
    getInputs: (data: BaseTaskData) => data.templates?.['task_template']?.parameters || null,
    getOutputType: () => 'Task Response',
    requiredApis: [] as ApiType[]
  },

  code_execution: {
    getInputs: (data: BaseTaskData) => data.templates?.['task_template']?.parameters || null,
    getOutputType: () => 'Code Execution',
    requiredApis: [] as ApiType[]
  }
};

// Main configuration mapping using reusable definitions
const NODE_CONFIGS: { [key in TaskType]?: { [nodeName: string]: NodeConfig } } = {
  PromptAgentTask: {
    llm_generation: { ...NODE_DEFINITIONS.llm_generation },
    tool_call_execution: { ...NODE_DEFINITIONS.tool_call_execution },
    code_execution: { ...NODE_DEFINITIONS.code_execution }
  },

  CodeGenerationLLMTask: {
    llm_generation: { ...NODE_DEFINITIONS.llm_generation },
    code_execution: { ...NODE_DEFINITIONS.code_execution }
  },

  CheckTask: {
    llm_generation: { ...NODE_DEFINITIONS.llm_generation }
  },

  CodeExecutionLLMTask: {
    code_execution: { ...NODE_DEFINITIONS.code_execution }
  },

  WebScrapeBeautifulSoupTask: {
    fetch_url: {
      getInputs: () => ({
        type: 'object',
        properties: { url: { type: 'string', description: 'URL to fetch' } },
        required: ['url']
      }),
      getOutputType: () => 'Message',
      requiredApis: [ApiType.REQUESTS]
    },
    generate_selectors_and_parse: {
      getInputs: () => ({
        type: 'object',
        properties: {
          fetch_url: { type: 'string', description: 'URL response' },
          fetch_url_html_content: { type: 'string', description: 'HTML content' }
        },
        required: ['fetch_url']
      }),
      getOutputType: () => 'Message',
      requiredApis: [ApiType.LLM_MODEL]
    }
  },

  RetrievalTask: {
    ensure_embeddings_in_data_cluster: {
      getInputs: () => ({
        type: 'object',
        properties: { data_cluster: { type: 'object', description: 'Data cluster' } },
        required: ['data_cluster']
      }),
      getOutputType: () => 'Embedding Chunks',
      requiredApis: [ApiType.EMBEDDINGS]
    },
    retrieve_relevant_embeddings: {
      getInputs: (data) => data.input_variables,
      getOutputType: () => 'Embedding Chunks',
      requiredApis: [] as ApiType[]
    }
  },

  EmbeddingTask: {
    generate_embedding: {
      getOutputType: () => 'Embedding Chunks',
      requiredApis: [ApiType.EMBEDDINGS]
    }
  },

  GenerateImageTask: {
    generate_image: {
      getOutputType: () => 'File',
      requiredApis: [ApiType.IMG_GENERATION]
    }
  },

  TextToSpeechTask: {
    text_to_speech: {
      getOutputType: () => 'File',
      requiredApis: [ApiType.TEXT_TO_SPEECH]
    }
  }
};

export { NODE_CONFIGS, type NodeConfig };

// Helper function to get node config
const getNodeConfig = (taskType: TaskType | undefined, nodeName: string): NodeConfig | null => {
  if (!taskType) return null;
  return NODE_CONFIGS[taskType]?.[nodeName] || null;
};

// Component for displaying required APIs
const RequiredApis: React.FC<{ apis: ApiType[] }> = ({ apis }) => {
  if (apis.length === 0) return null;
  
  return (
    <Stack spacing={0.5} alignItems="center">
      <Typography variant="caption" color={theme.palette.secondary.contrastText}>
        Required APIs
      </Typography>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center">
        {apis.map((api) => (
          <Box
            key={api}
            sx={{
              color: theme.palette.primary.dark,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            {apiTypeIcons[api]}
          </Box>
        ))}
      </Stack>
    </Stack>
  );
};

// Component for the content area
interface NodeContentAreaProps {
  data: BaseTaskData;
  nodeConfig: NodeConfig | null;
  requiredApis: ApiType[];
}

const NodeContentArea: React.FC<NodeContentAreaProps> = ({ data, nodeConfig, requiredApis }) => {
  const { selectCardItem } = useCardDialog();

  return (
    <Stack spacing={1}>
      <Typography 
        className="text-sm"
        color={theme.palette.primary.dark}
      >
        {data.task_name}
      </Typography>
      
      <Accordion 
        sx={{
          backgroundColor: theme.palette.secondary.light,
          color: theme.palette.primary.dark,
          borderRadius: theme.shape.borderRadius
        }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="caption">Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {nodeConfig?.getContent?.(data, selectCardItem)}
            <RequiredApis apis={requiredApis} />
            {nodeConfig?.getOutputType() && (
              <Typography variant="caption" textAlign="center">
                Output Type: {nodeConfig.getOutputType()}
              </Typography>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};

// Main function to get node areas
export const getNodeAreas = (data: BaseTaskData) => {
  const nodeConfig = getNodeConfig(data.task_type, data.task_name);

  // Get input parameters
  const inputParams = nodeConfig?.getInputs?.(data) || data.input_variables;
  const required = new Set(inputParams?.required || []);
  const properties = inputParams?.properties || {};

  // Get required APIs and ensure unique values - TODO: Remove duplicates
  const requiredApis = [...(nodeConfig?.requiredApis || []), ...(data.required_apis || [])];

  return {
    inputArea: <InputArea properties={properties} required={required} />,
    outputArea: <OutputArea taskName={data.task_name} />,
    exitCodeArea: <ExitCodeArea exitCodes={Object.entries(data.exit_codes || {}).sort(([a], [b]) => parseInt(a) - parseInt(b))} />,
    contentArea: <NodeContentArea data={data} nodeConfig={nodeConfig} requiredApis={requiredApis} />
  };
};