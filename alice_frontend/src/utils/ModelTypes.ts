import { User, convertToUser } from "./Types";

export interface AliceModel {
    _id?: string;
    short_name: string;
    model_name: string;
    model_format?: string;
    ctx_size?: number;
    model_type: 'instruct' | 'chat' | 'vision';
    deployment: 'local' | 'remote';
    model_file?: string | null;
    api_key: string;
    port?: number;
    api_type: 'openai' | 'azure' | 'anthropic';
    base_url: string;
    autogen_model_client_cls?: string | null;
    created_by?: User;
    updated_by?: User;
    createdAt?: Date;
    updatedAt?: Date;
}

export const convertToAliceModel = (data: any): AliceModel => {
    return {
        _id: data?._id || undefined,
        short_name: data?.short_name || '',
        model_name: data?.model_name || '',
        model_format: data?.model_format || undefined,
        ctx_size: data?.ctx_size || undefined,
        model_type: data?.model_type || 'chat',
        deployment: data?.deployment || 'local',
        model_file: data?.model_file || null,
        api_key: data?.api_key || '',
        port: data?.port || undefined,
        api_type: data?.api_type || 'openai',
        base_url: data?.base_url || '',
        autogen_model_client_cls: data?.autogen_model_client_cls || null,
        created_by: data?.created_by ? convertToUser(data.created_by) : undefined,
        updated_by: data?.updated_by ? convertToUser(data.updated_by) : undefined,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};

export interface ModelComponentProps {
  items: AliceModel[] | null;
  item: AliceModel | null;
  onChange: (newItem: Partial<AliceModel>) => void;
  mode: 'create' | 'view' | 'edit';
  handleSave: () => Promise<void>;
  isInteractable?: boolean;
  onInteraction?: (model: AliceModel) => void;
  showHeaders?: boolean;
}
