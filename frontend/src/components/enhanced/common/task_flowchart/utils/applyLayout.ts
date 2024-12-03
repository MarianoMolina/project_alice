import { Node, Edge } from 'reactflow';
import dagre from 'dagre';
import Logger from '../../../../../utils/Logger';

export const MIN_NODE_WIDTH = 300;
export const MIN_NODE_HEIGHT = 150;

export function applyLayout(
  nodes: Node[], 
  edges: Edge[],
  nodeSizes: Map<string, {width: number; height: number}>
): Node[] {
  Logger.debug('[FlowLayout] Starting layout calculation', {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeSizes: Array.from(nodeSizes.entries()).map(([id, size]) => ({
      id,
      size
    }))
  });

  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB',
    ranksep: 80,
    nodesep: 50,
    ranker: 'tight-tree'
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add and log nodes as they're added to the graph
  nodes.forEach(node => {
    const size = nodeSizes.get(node.id);
    if (!size) {
      Logger.warn('[FlowLayout] Missing size for node', { nodeId: node.id });
      return;
    }
    
    const width = Math.max(size.width || MIN_NODE_WIDTH, MIN_NODE_WIDTH);
    const height = Math.max(size.height || MIN_NODE_HEIGHT, MIN_NODE_HEIGHT);
    
    Logger.debug('[FlowLayout] Adding node to graph', {
      nodeId: node.id,
      originalSize: size,
      finalSize: { width, height }
    });
    
    g.setNode(node.id, { width, height });
  });

  // Add and log edges
  edges.forEach(edge => {
    Logger.debug('[FlowLayout] Adding edge to graph', {
      edge: {
        id: edge.id,
        source: edge.source,
        target: edge.target
      }
    });
    g.setEdge(edge.source, edge.target);
  });

  // Run layout
  try {
    dagre.layout(g);
  } catch (error) {
    Logger.error('[FlowLayout] Error during dagre layout', { error });
    throw error;
  }

  // Create new nodes with calculated positions
  const layoutedNodes = nodes.map(node => {
    const nodeWithPos = g.node(node.id);
    const size = nodeSizes.get(node.id)!;

    Logger.debug('[FlowLayout] Calculating final position for node', {
      nodeId: node.id,
      dagrePosition: nodeWithPos ? { x: nodeWithPos.x, y: nodeWithPos.y } : null,
      nodeSize: size
    });

    if (!nodeWithPos) {
      Logger.warn('[FlowLayout] No position calculated for node', { nodeId: node.id });
      return node;
    }

    const position = {
      x: nodeWithPos.x - (size.width / 2),
      y: nodeWithPos.y - (size.height / 2)
    };

    Logger.debug('[FlowLayout] Final position calculated', {
      nodeId: node.id,
      position,
      calculation: {
        x: `${nodeWithPos.x} - (${size.width} / 2)`,
        y: `${nodeWithPos.y} - (${size.height} / 2)`
      }
    });

    return {
      ...node,
      position
    };
  });

  return layoutedNodes;
}