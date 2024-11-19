import { Node, Edge, MarkerType } from 'reactflow';
import { getNodeData, isFullTask } from './FlowChartUtils';
import { AliceTask } from '../../../../../types/TaskTypes';
import Logger from '../../../../../utils/Logger';

function generateSimpleHash(obj: any): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

function generateNodeId(
  taskName: string, 
  parentTask: Partial<AliceTask>,
  routingContext: string
): string {
  const nodeContext = {
    name: taskName,
    routing: parentTask.node_end_code_routing?.[taskName] || {},
    context: routingContext
  };
  const hash = generateSimpleHash(nodeContext);
  return `${taskName}-${hash}`;
}

export function createNodes(
  task: Partial<AliceTask>,
  onSizeChange: (id: string, width: number, height: number) => void
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const addedNodes = new Set<string>();
  const visited = new Set<string>();
  const nodeSequence: string[] = [];
  
  const routingContext = generateSimpleHash(task.node_end_code_routing || {});
  Logger.debug('[Flow:createNodes] Generated routing context', { 
    routingContext,
    taskName: task.task_name
  });

  const addNode = (nodeName: string) => {
    const nodeId = generateNodeId(nodeName, task, routingContext);
    if (addedNodes.has(nodeId)) return nodeId;
    
    Logger.debug('[Flow:createNodes] Adding node', {
      nodeName,
      nodeId,
      routingContext
    });

    if (nodeName === "End") {
      nodes.push({
        id: nodeId,
        type: 'endNode',
        data: { 
          label: "End", 
          onSizeChange: (id: string, width: number, height: number) => onSizeChange(id, width, height)
        },
        position: { x: 0, y: 0 },
      });
    } else {
      const nodeData = getNodeData(task, nodeName);
      if (nodeData) {
        nodes.push({
          id: nodeId,
          type: isFullTask(nodeData) ? 'taskNode' : 'simpleNode',
          data: {
            ...nodeData,
            onSizeChange: (id: string, width: number, height: number) => onSizeChange(id, width, height)
          },
          position: { x: 0, y: 0 },
        });
      }
    }
    
    addedNodes.add(nodeId);
    return nodeId;
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
    const sourceId = generateNodeId(sourceName, task, routingContext);
    const routeMap = task.node_end_code_routing?.[sourceName];
    
    if (!routeMap) {
      Logger.warn('[Flow:createNodes:addEdges] No route map for node', { sourceName });
      return;
    }

    Object.entries(routeMap).forEach(([exitCode, [nextTask, isFailure]]) => {
      if (!nextTask) {
        const endId = generateNodeId("End", task, routingContext);
        if (!addedNodes.has(endId)) {
          addNode("End");
        }
        
        const edgeId = `${sourceId}-${endId}-${exitCode}-${routingContext}`;
        edges.push({
          id: edgeId,
          source: sourceId,
          target: endId,
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

      const targetId = addNode(nextTask);
      const edgeId = `${sourceId}-${targetId}-${exitCode}-${routingContext}`;
      const edgeType = determineEdgeType(sourceName, nextTask);
      
      Logger.debug('[Flow:createNodes:addEdges] Creating edge', {
        edgeId,
        source: sourceId,
        target: targetId,
        type: edgeType,
        exitCode,
        routingContext
      });

      edges.push({
        id: edgeId,
        source: sourceId,
        target: targetId,
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
    nodeSequence.push(nodeName);
    
    Logger.debug('[Flow:createNodes:traverseNodes] Processing node', {
      nodeName,
      currentSequence: [...nodeSequence],
      routingContext
    });

    addEdges(nodeName);

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