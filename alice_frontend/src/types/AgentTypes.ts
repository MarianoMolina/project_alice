import { User } from "./UserTypes";
import { AliceModel, ModelType } from "./ModelTypes";
import { Prompt } from "./PromptTypes";
import { HandleClickProps } from "./CollectionTypes";

export interface AliceAgent {
  _id?: string;
  name: string;
  system_message: Prompt;
  has_functions: boolean;
  has_code_exec: boolean;
  max_consecutive_auto_reply?: number;
  models?: { [key in ModelType]?: AliceModel };
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
    has_functions: data?.has_functions || false,
    has_code_exec: data?.has_code_exec || false,
    max_consecutive_auto_reply: data?.max_consecutive_auto_reply || undefined,
    models: data?.models || {},
    created_by: data?.created_by || undefined,
    updated_by: data?.updated_by || undefined,
    createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
  };
};

export interface AgentComponentProps extends HandleClickProps {
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

export const getDefaultAgentForm = (): Partial<AliceAgent> => ({
  name: '',
  system_message: undefined,
  max_consecutive_auto_reply: 1,
  has_functions: false,
  has_code_exec: false,
  models: {},
});