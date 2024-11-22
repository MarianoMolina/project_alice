import { AliceModel, ModelType } from "./ModelTypes";
import { Prompt } from "./PromptTypes";
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";

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