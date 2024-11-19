import { Node, Edge, MarkerType } from 'reactflow';
import { getNodeData, isFullTask } from './FlowChartUtils';
import { AliceTask } from '../../../../../types/TaskTypes';
import Logger from '../../../../../utils/Logger';

export function createNodes(
  task: Partial<AliceTask>,
  onSizeChange: (id: string, width: number, height: number) => void
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addedNodes = new Set<string>();
  const visited = new Set<string>();
  const nodeSequence: string[] = [];  // Track the sequence of nodes as we visit them

  const addNode = (nodeName: string) => {
    if (addedNodes.has(nodeName)) return;
    
    if (nodeName === "End") {
      nodes.push({
        id: nodeName,
        type: 'endNode',
        data: { label: "End", onSizeChange },
        position: { x: 0, y: 0 },
      });
    } else {
      const nodeData = getNodeData(task, nodeName);
      if (nodeData) {
        nodes.push({
          id: nodeName,
          type: isFullTask(nodeData) ? 'taskNode' : 'simpleNode',
          data: {
            ...nodeData,
            onSizeChange,
          },
          position: { x: 0, y: 0 },
        });
      }
    }
    
    addedNodes.add(nodeName);
  };

  const determineEdgeType = (sourceName: string, targetName: string): string => {
    if (sourceName === targetName) {
      return 'selfLoop';
    }
  
    const sourceIndex = nodeSequence.indexOf(sourceName);
    const targetIndex = nodeSequence.indexOf(targetName);
    
    if (targetIndex !== -1 && targetIndex < sourceIndex) {
      return 'doubleBack';
    }
  
    return 'distributedDefault';
  };

  const addEdges = (sourceName: string) => {
    const routeMap = task.node_end_code_routing?.[sourceName];
    if (!routeMap) {
      Logger.warn('[createNodes:addEdges] No route map for node', { sourceName });
      return;
    }

    Object.entries(routeMap).forEach(([exitCode, [nextTask, isFailure]]) => {
      if (!nextTask) {
        if (!addedNodes.has("End")) {
          addNode("End");
        }
        const edgeId = `${sourceName}-End-${exitCode}`;
        edges.push({
          id: edgeId,
          source: sourceName,
          target: "End",
          type: 'distributedDefault',
          data: {
            exitCode,
            exitCodes: Object.keys(routeMap)
          },
          label: exitCode,
          labelStyle: { fill: '#888', fontWeight: 700 },
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: isFailure ? '#FF0000' : '#00FF00', strokeWidth: 2 },
          animated: true,
        });
        return;
      }

      addNode(nextTask);
      const edgeId = `${sourceName}-${nextTask}-${exitCode}`;
      const edgeType = determineEdgeType(sourceName, nextTask);
      
      Logger.debug('[createNodes:addEdges] Creating edge', {
        edgeId,
        source: sourceName,
        target: nextTask,
        type: edgeType,
        exitCode
      });

      edges.push({
        id: edgeId,
        source: sourceName,
        target: nextTask,
        type: edgeType,
        data: {
          exitCode,
          exitCodes: Object.keys(routeMap)
        },
        label: exitCode,
        labelStyle: { fill: '#888', fontWeight: 700 },
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: isFailure ? '#FF0000' : '#00FF00', strokeWidth: 2 },
        animated: true,
      });
    });
  };

  const traverseNodes = (nodeName: string) => {
    if (visited.has(nodeName)) return;
    
    visited.add(nodeName);
    nodeSequence.push(nodeName);  // Add node to sequence as we visit it
    
    Logger.debug('[createNodes:traverseNodes] Added node to sequence', {
      nodeName,
      currentSequence: [...nodeSequence]
    });

    addEdges(nodeName);

    // Process connections for next nodes
    const routeMap = task.node_end_code_routing?.[nodeName];
    if (routeMap) {
      Object.entries(routeMap).forEach(([_, [nextTask]]) => {
        if (nextTask) {
          traverseNodes(nextTask);
        }
      });
    }
  };

  if (task.start_node) {
    addNode(task.start_node);
    traverseNodes(task.start_node);
  }

  return { nodes, edges };
}