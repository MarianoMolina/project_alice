import { API, convertToAPI } from "./ApiTypes";

export type ComponentMode = 'create' | 'edit' | 'view' | 'list' | 'shortList' | 'table';
export type FullComponentMode = 'card' | 'full' | 'create' | 'edit' | 'view' | 'list' | 'shortList' | 'table';

export interface ModelConfig {
  model: string;
  api_key?: string;
  base_url?: string;
  api_type?: string;
  model_client_cls?: string;
}

export interface LLMConfig {
  config_list: ModelConfig[];
  temperature?: number;
  timeout?: number;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  apis?: API[];
  default_llm_api?: API;
  createdAt?: Date;
  updatedAt?: Date;
}

export const convertToUser = (data: any): User => {
  return {
    _id: data?._id || undefined,
    name: data?.name || '',
    email: data?.email || '',
    role: data?.role || 'user',
    apis: data?.apis?.map(convertToAPI) || [],
    default_llm_api: convertToAPI(data?.default_llm_api) || undefined,
    createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
    updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
  };
};