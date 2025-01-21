import { AliceModel, ModelType } from "./ModelTypes";
import { Prompt } from "./PromptTypes";
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";
import { AgentOverviewContent } from "../utils/AgentUtils";

export enum ToolPermission {
  DISABLED = 0,
  NORMAL = 1,
  WITH_PERMISSION = 2,
  DRY_RUN = 3
}
export enum CodePermission {
  DISABLED = 0,
  NORMAL = 1,
  WITH_PERMISSION = 2,
  TAGGED_ONLY = 3
}

export interface AliceAgent extends BaseDatabaseObject {
  name: string;
  system_message: Prompt;
  has_tools: ToolPermission;
  has_code_exec: CodePermission;
  max_consecutive_auto_reply?: number;
  models?: { [key in ModelType]?: AliceModel };
}

export const convertToAliceAgent = (data: AliceAgent): AliceAgent => ({
  ...convertToBaseDatabaseObject(data),
  name: data.name || '',
  system_message: data.system_message || {},
  has_tools: data.has_tools || 0,
  has_code_exec: data.has_code_exec || 0,
  max_consecutive_auto_reply: data.max_consecutive_auto_reply,
  models: data.models || {},
});

export interface AgentComponentProps extends EnhancedComponentProps<AliceAgent> {
}

export const getDefaultAgentForm = (): Partial<AliceAgent> => ({
  name: '',
  system_message: undefined,
  max_consecutive_auto_reply: 1,
  has_tools: 0,
  has_code_exec: 0,
  models: {},
});

export const mapCodePermission = (permission: CodePermission): string => {
  switch (permission) {
    case CodePermission.DISABLED:
      return 'Disabled';
    case CodePermission.NORMAL:
      return 'Normal';
    case CodePermission.WITH_PERMISSION:
      return 'With Permission';
    case CodePermission.TAGGED_ONLY:
      return 'Tagged Only';
    default:
      return 'Unknown';
  }
}
export const mapToolPermission = (permission: ToolPermission): string => {
  switch (permission) {
    case ToolPermission.DISABLED:
      return 'Disabled';
    case ToolPermission.NORMAL:
      return 'Normal';
    case ToolPermission.WITH_PERMISSION:
      return 'With Permission';
    case ToolPermission.DRY_RUN:
      return 'Dry Run';
    default:
      return 'Unknown';
  }
}

export const agentDescription: AgentOverviewContent = {
  "sections": {
    "system_prompt": {
      "title": "System Prompt",
      "description": "The system prompt defines your agent's core instructions and behavior using templating and special formatting.",
      "subsections": {
        "templating": {
          "title": "Template System",
          "details": [
            {
              "title": "Jinja2 Templating",
              "description": "System prompts use Jinja2 templating for variable injection",
              "examples": [
                "{{ current_time }}: Injects current timestamp",
                "{{ user_data.name }}: Accesses user information"
              ]
            }
          ]
        },
        "special_tags": {
          "title": "Special Frontend Tags",
          "description": "HTML-style tags that modify how agent outputs are processed and displayed",
          "tags": [
            {
              "name": "<analysis>",
              "purpose": "Designates Chain-of-Thought reasoning sections",
              "usage": "Instruct agents to use this tag when you want them to show their reasoning process"
            },
            {
              "name": "<aliceDocument>",
              "purpose": "Creates clearly separated, structured output sections",
              "usage": "Particularly useful in chat agents for organizing different parts of responses"
            }
          ]
        }
      }
    },
    "permissions": {
      "title": "Permission Controls",
      "description": "Configure security boundaries and interaction patterns for tools and code execution",
      "subsections": {
        "tool_permissions": {
          "title": "Tool Usage",
          "description": "Controls how the agent can interact with provided tools",
          "levels": [
            {
              "name": "DISABLED",
              "description": "Agent cannot use tools, even if provided in chat",
              "use_case": "When you want to ensure no tool usage regardless of context"
            },
            {
              "name": "NORMAL",
              "description": "Full access to any provided tools",
              "use_case": "For agents designed to regularly use tools"
            },
            {
              "name": "WITH_PERMISSION",
              "description": "Requires user approval for tool usage",
              "use_case": "When you want to review tool usage before execution"
            },
            {
              "name": "DRY_RUN",
              "description": "Simulates tool usage without actual execution",
              "use_case": "Testing or demonstrating tool interactions safely"
            }
          ]
        },
        "code_permissions": {
          "title": "Code Execution",
          "description": "Determines how code blocks are handled",
          "supported_languages": ["JavaScript/TypeScript", "Python", "Bash/Shell"],
          "levels": [
            {
              "name": "DISABLED",
              "description": "Code is displayed but never executed",
              "use_case": "Default for most agents - safe code sharing"
            },
            {
              "name": "NORMAL",
              "description": "Automatically executes all code blocks in supported languages",
              "use_case": "Specifically for coding-focused agents"
            },
            {
              "name": "WITH_PERMISSION",
              "description": "User chooses which code blocks to execute",
              "use_case": "When occasional code execution is needed with user control"
            },
            {
              "name": "TAGGED_ONLY",
              "description": "Only executes code blocks marked with '_execute' tag",
              "use_case": "Allows agent to decide which code should be executed while maintaining control",
              "example": "```python_execute"
            }
          ]
        },
        "auto_reply": {
          "title": "Auto-Reply Limit",
          "description": "Maximum number of consecutive automated responses",
          "purpose": "Prevents infinite loops and ensures user engagement"
        }
      }
    },
    "models": {
      "title": "Model Configuration",
      "description": "Define AI models for different capabilities and tasks",
      "subsections": {
        "model_types": {
          "title": "Model Categories",
          "categories": [
            {
              "name": "Primary Models",
              "types": [
                {
                  "name": "CHAT",
                  "description": "Main communication model - required for chat agents",
                  "usage": "Primary interaction model for most agents"
                },
                {
                  "name": "INSTRUCT",
                  "description": "Legacy type - serves as fallback for chat if no chat model defined",
                  "usage": "Not recommended for new configurations"
                }
              ]
            },
            {
              "name": "Secondary Models",
              "description": "Optional capabilities for specific tasks",
              "types": [
                {
                  "name": "VISION",
                  "purpose": "Image understanding and analysis"
                },
                {
                  "name": "STT",
                  "purpose": "Speech-to-text conversion"
                },
                {
                  "name": "TTS",
                  "purpose": "Text-to-speech generation"
                },
                {
                  "name": "EMBEDDINGS",
                  "purpose": "Text analysis and vector operations"
                },
                {
                  "name": "IMG_GEN",
                  "purpose": "Image generation"
                }
              ]
            }
          ]
        },
        "usage_notes": {
          "title": "Important Notes",
          "points": [
            "Chat agents only require chat model for basic operation",
            "Secondary models needed only if agent specifically configures task models",
            "Tasks will use any valid model of required type if no specific model is configured",
            "Model configuration allows fine-tuning of specific task behaviors"
          ]
        },
        "model_settings": {
          "title": "Configuration Options",
          "settings": [
            {
              "name": "Context Size",
              "description": "Maximum token window for model operation"
            },
            {
              "name": "Temperature",
              "description": "Controls randomness in model outputs"
            },
            {
              "name": "Seed",
              "description": "Optional value for reproducible outputs"
            },
            {
              "name": "Cache Settings",
              "description": "Controls response caching behavior"
            },
            {
              "name": "Token Limits",
              "description": "Maximum generation length"
            },
            {
              "name": "Cost Tracking",
              "description": "Parameters for input/output token cost calculation"
            }
          ]
        }
      }
    }
  }
}