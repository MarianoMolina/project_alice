import  { Model, Types } from 'mongoose';

export interface IAgent {
    name: string;
    system_message: Types.ObjectId | string;
    agents_in_group: any[];
    autogen_class: 'ConversableAgent' | 'UserProxyAgent' | 'LLaVAAgent';
    code_execution_config: boolean;
    max_consecutive_auto_reply: number;
    human_input_mode: 'ALWAYS' | 'TERMINATE' | 'NEVER';
    speaker_selection: Map<string, string>;
    default_auto_reply: string | null;
    model_id: Types.ObjectId | null;
    created_by: Types.ObjectId;
    updated_by: Types.ObjectId;
}

export interface IAgentMethods {
    apiRepresentation(): any;
}

export type AgentModel = Model<IAgent, {}, IAgentMethods>;

 