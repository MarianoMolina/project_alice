import { BaseTaskData } from '../../utils/FlowChartUtils';
import { TaskType } from '../../../../../types/TaskTypes';
import { OutputType } from '../../../../../types/ReferenceTypes';
import Logger from '../../../../../utils/Logger';
import { InputArea } from './InputArea';
import { OutputArea } from './OutputArea';
import { ExitCodeArea } from './ExitCodeArea';
import { NODE_CONFIGS, NodeConfig } from './TaskTypeNodeDefinitions';
import { NodeContentArea } from './ContentArea';

// Helper function to get node config
const getNodeConfig = (taskType: TaskType | undefined, nodeName: string): NodeConfig | null => {
  if (!taskType) return null;
  return NODE_CONFIGS[taskType]?.[nodeName] || null;
};

const getOutputTypeFromTaskType = (taskType: TaskType | undefined, nodeName: string): OutputType | null => {
  if (!taskType) return null;
  return NODE_CONFIGS[taskType]?.[nodeName]?.getOutputType() || null;
}

// Main function to get node areas
export const getNodeAreas = (data: BaseTaskData) => {
  const nodeConfig = getNodeConfig(data.task_type, data.task_name);

  // Get input parameters
  const inputParams = nodeConfig?.getInputs?.(data) || data.input_variables;
  const required = new Set(inputParams?.required || []);
  const properties = inputParams?.properties || {};

  // Get required APIs and ensure unique values using a Set
  const requiredApis = Array.from(
    new Set([
      ...(nodeConfig?.requiredApis || []),
      ...(data.required_apis || [])
    ])
  );
  const outputType = getOutputTypeFromTaskType(data.task_type, data.task_name) ?? OutputType.TASK_RESPONSE

  Logger.debug('[Flow ShareNode] outputType:', outputType);

  return {
    inputArea: <InputArea properties={properties} required={required} />,
    outputArea: <OutputArea taskName={data.task_name} outputType={outputType} />,
    exitCodeArea: <ExitCodeArea
      exitCodes={Object.entries(data.exit_codes || {})
        .sort(([a], [b]) => parseInt(a) - parseInt(b))}
    />,
    contentArea: <NodeContentArea
      data={data}
      nodeConfig={nodeConfig}
      requiredApis={requiredApis}
    />
  };
};