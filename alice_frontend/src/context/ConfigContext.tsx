import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AliceModel } from '../utils/ModelTypes';
import { ParameterDefinition } from '../utils/ParameterTypes';
import { Prompt } from '../utils/PromptTypes';
import { TaskResponse } from '../utils/TaskResponseTypes';
import { AliceAgent } from '../utils/AgentTypes';
import { AliceTask } from '../utils/TaskTypes';
import { useApi } from './ApiContext';
import { AliceChat } from '../utils/ChatTypes';
import { API } from '../utils/ApiTypes';

export type ConfigItemType = 'Agent' | 'Model' | 'Parameter' | 'Prompt' | 'Task' | 'TaskResponse' | 'Chat' | 'API'; 

interface ConfigContextType {
  agents: AliceAgent[];
  models: AliceModel[];
  parameters: ParameterDefinition[];
  prompts: Prompt[];
  tasks: AliceTask[];
  apis: API[];
  selectedItem: AliceAgent | AliceModel | ParameterDefinition | Prompt | AliceTask | TaskResponse | AliceChat | API | null;
  selectedItemType: ConfigItemType | null;
  setSelectedItem: (item: AliceAgent | AliceModel | ParameterDefinition | Prompt | AliceTask | TaskResponse | AliceChat | API | null) => void;
  setSelectedItemType: (type: ConfigItemType | null) => void; // Updated to allow null
  refreshItems: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { fetchItem } = useApi();
  const [agents, setAgents] = useState<AliceAgent[]>([]);
  const [models, setModels] = useState<AliceModel[]>([]);
  const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tasks, setTasks] = useState<AliceTask[]>([]);
  const [apis, setApis] = useState<API[]>([]);
  const [selectedItem, setSelectedItem] = useState<AliceAgent | AliceModel | ParameterDefinition | Prompt | AliceTask | TaskResponse | AliceChat | API | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<ConfigItemType | null>("Agent"); // Updated to allow null

  const refreshItems = async () => {
    const fetchedAgents = await fetchItem('agents');
    const fetchedModels = await fetchItem('models');
    const fetchedParameters = await fetchItem('parameters');
    const fetchedPrompts = await fetchItem('prompts');
    const fetchedTasks = await fetchItem('tasks');
    const fetchedApis = await fetchItem('apis');
    setAgents(fetchedAgents as AliceAgent[]);
    setModels(fetchedModels as AliceModel[]);
    setParameters(fetchedParameters as ParameterDefinition[]);
    setPrompts(fetchedPrompts as Prompt[]);
    setTasks(fetchedTasks as AliceTask[]);
    setApis(fetchedApis as API[]);
  };

  useEffect(() => {
    refreshItems();
  }, []);

  const value: ConfigContextType = {
    agents,
    models,
    parameters,
    prompts,
    tasks,
    selectedItem,
    selectedItemType,
    setSelectedItem,
    setSelectedItemType,
    refreshItems,
    apis,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};