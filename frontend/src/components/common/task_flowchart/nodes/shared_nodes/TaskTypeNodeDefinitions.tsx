import React from 'react';
import { BaseTaskData } from '../../utils/FlowChartUtils';
import { Chip, Stack } from '@mui/material';
import { ApiType } from '../../../../../types/ApiTypes';
import { FunctionParameters, ParameterTypes } from '../../../../../types/ParameterTypes';
import { TaskType } from '../../../../../types/TaskTypes';
import theme from '../../../../../Theme';
import { CollectionElementString, CollectionPopulatedElement } from '../../../../../types/CollectionTypes';
import { OutputType } from '../../../../../types/ReferenceTypes';
// Node type mappings
export interface NodeConfig {
  getInputs?: (data: BaseTaskData) => FunctionParameters | null;
  getContent?: (data: BaseTaskData, selectCardItem: (type: CollectionElementString, id?: string, data?: CollectionPopulatedElement) => void) => React.ReactNode;
  getOutputType: () => OutputType;
  requiredApis: ApiType[];
}

// Define a type for our node definitions to handle the readonly arrays
export type NodeDefinition = {
  getInputs?: (data: BaseTaskData) => FunctionParameters | null;
  getContent?: (data: BaseTaskData, selectCardItem: (type: CollectionElementString, id?: string, data?: CollectionPopulatedElement) => void) => React.ReactNode;
  getOutputType: () => OutputType;
  requiredApis: ApiType[];
};

// Reusable node definitions with proper typing
const NODE_DEFINITIONS: { [key: string]: NodeDefinition } = {
  llm_generation: {
    getInputs: (data: BaseTaskData) => data.templates?.['task_template']?.parameters || null,
    getContent: (data: BaseTaskData, selectCardItem: (type: CollectionElementString, id?: string, data?: CollectionPopulatedElement) => void) => (
      <Stack spacing={1}>
        {['agent_system_message', 'task_template', 'output_template', 'code_template'].map(templateName => {
          const template = templateName === 'agent_system_message' ? data.agent?.system_message : data.templates?.[templateName];
          if (!template) return null;
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
    getOutputType: () => OutputType.MESSAGE,
    requiredApis: [ApiType.LLM_MODEL]
  },

  tool_call_execution: {
    getInputs: (data: BaseTaskData) => data.templates?.['task_template']?.parameters || null,
    getOutputType: () => OutputType.TASK_RESPONSE,
    requiredApis: [] as ApiType[]
  },

  code_execution: {
    getInputs: (data: BaseTaskData) => data.templates?.['task_template']?.parameters || null,
    getOutputType: () => OutputType.CODE_EXECUTION,
    requiredApis: [] as ApiType[]
  },
  default: {
    getInputs: (data: BaseTaskData) => data.input_variables || null,
    getOutputType: () => OutputType.TASK_RESPONSE,
    requiredApis: [] as ApiType[]
  }
};

// Main configuration mapping using reusable definitions
export const NODE_CONFIGS: { [key in TaskType]?: { [nodeName: string]: NodeConfig } } = {
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
    code_execution: { ...NODE_DEFINITIONS.code_execution },
  },

  WebScrapeBeautifulSoupTask: {
    fetch_url: {
      getInputs: () => ({
        type: 'object',
        properties: { url: { type: ParameterTypes.STRING, description: 'URL to fetch' } },
        required: ['url']
      }),
      getOutputType: () => OutputType.MESSAGE,
      requiredApis: [ApiType.REQUESTS]
    },
    generate_selectors_and_parse: {
      getInputs: () => ({
        type: 'object',
        properties: {
          fetch_url: { type: ParameterTypes.STRING, description: 'URL response' },
          fetch_url_html_content: { type: ParameterTypes.STRING, description: 'HTML content' }
        },
        required: ['fetch_url']
      }),
      getOutputType: () => OutputType.MESSAGE,
      requiredApis: [ApiType.LLM_MODEL]
    }
  },

  RetrievalTask: {
    ensure_embeddings_in_data_cluster: {
      getInputs: () => ({
        type: 'object',
        properties: {
          data_cluster: { type: ParameterTypes.OBJECT, description: 'Data cluster' }
        },
        required: ['data_cluster']
      }),
      getOutputType: () => OutputType.EMBEDDING,
      requiredApis: [ApiType.EMBEDDINGS]
    },
    retrieve_relevant_embeddings: {
      getInputs: (data) => {
        const baseInputs = data.input_variables?.properties || {};
        const baseRequired = data.input_variables?.required || [];

        return {
          type: 'object',
          properties: {
            data_cluster: { type: ParameterTypes.OBJECT, description: 'Data cluster' },
            ...baseInputs
          },
          required: ['data_cluster', ...baseRequired]
        };
      },
      getOutputType: () => OutputType.EMBEDDING,
      requiredApis: [] as ApiType[]
    }
  },

  EmbeddingTask: {
    generate_embedding: {
      getOutputType: () => OutputType.EMBEDDING,
      requiredApis: [ApiType.EMBEDDINGS]
    }
  },

  GenerateImageTask: {
    generate_image: {
      getOutputType: () => OutputType.FILE,
      requiredApis: [ApiType.IMG_GENERATION]
    }
  },

  TextToSpeechTask: {
    text_to_speech: {
      getOutputType: () => OutputType.FILE,
      requiredApis: [ApiType.TEXT_TO_SPEECH]
    }
  },
  APITask: {
    default: { ...NODE_DEFINITIONS.default, getOutputType: () => OutputType.ENTITY_REFERENCE },
  }
}