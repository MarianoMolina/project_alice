import { User } from "./UserTypes";
import { AliceModel } from "./ModelTypes";
import { Prompt } from "./PromptTypes";

export interface AliceAgent {
  _id?: string;
  name: string;
  system_message: Prompt;
  functions?: any[];
  functions_map?: { [key: string]: string };
  agents_in_group?: any[];
  autogen_class: "ConversableAgent" | "AssistantAgent" | "UserProxyAgent" | "GroupChatManager" | "LLaVAAgent";
  code_execution_config: boolean;
  max_consecutive_auto_reply?: number;
  human_input_mode?: "ALWAYS" | "TERMINATE" | "NEVER";
  speaker_selection?: { [key: string]: string };
  default_auto_reply?: string | null;
  llm_config?: { [key: string]: any };
  model_id?: AliceModel | null;
  created_by?: User;
  updated_by?: User;
  createdAt?: Date;
  updatedAt?: Date;
}

export const convertToAliceAgent = (data: any): AliceAgent => {
  return {
    _id: data?._id || undefined,
    name: data?.name || '',
    system_message: data?.system_message || {},
    functions: data?.functions || [],
    functions_map: data?.functions_map || {},
    agents_in_group: data?.agents_in_group || [],
    autogen_class: data?.autogen_class || "ConversableAgent",
    code_execution_config: data?.code_execution_config || false,
    max_consecutive_auto_reply: data?.max_consecutive_auto_reply || undefined,
    human_input_mode: data?.human_input_mode || undefined,
    speaker_selection: data?.speaker_selection || {},
    default_auto_reply: data?.default_auto_reply || null,
    llm_config: data?.llm_config || {},
    model_id: data?.model_id || null,
    created_by: data?.created_by || undefined,
    updated_by: data?.updated_by || undefined,
    createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
  };
};

export interface AgentComponentProps {
  items: AliceAgent[] | null;
  item: AliceAgent | null;
  onChange: (newItem: Partial<AliceAgent>) => void;
  mode: 'create' | 'view' | 'edit';
  handleSave: () => Promise<void>;
  isInteractable?: boolean;
  onInteraction?: (agent: AliceAgent) => void;
  onView?: (agent: AliceAgent) => void;
  showHeaders?: boolean;
}