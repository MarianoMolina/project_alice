import { User, convertToUser } from "./UserTypes";

export interface AliceModel {
    _id?: string;
    short_name: string;
    model_name: string;
    model_format?: string;
    ctx_size?: number;
    model_type: 'instruct' | 'chat' | 'vision';
    deployment: 'local' | 'remote';
    api_name: 'openai' | 'azure' | 'anthropic';
    temperature?: number;
    seed?: number | null;
    use_cache?: boolean;
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
        api_name: data?.api_name || 'openai',
        temperature: data?.temperature || undefined,
        seed: data?.seed || null,
        use_cache: data?.use_cache || false,
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
  onView?: (model: AliceModel) => void;
  onInteraction?: (model: AliceModel) => void;
  showHeaders?: boolean;
}

export const getDefaultModelForm = (): Partial<AliceModel> => ({
    short_name: '',
    model_name: '',
    model_format: '',
    ctx_size: 0,
    model_type: 'chat',
    deployment: 'remote',
    api_name: 'openai',
    temperature: 0.7,
    use_cache: true
});