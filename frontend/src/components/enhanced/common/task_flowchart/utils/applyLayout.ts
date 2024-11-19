import { Node, Edge } from 'reactflow';
import dagre from 'dagre';
import Logger from '../../../../../utils/Logger';

export const MIN_NODE_WIDTH = 300;
export const MIN_NODE_HEIGHT = 150;

export function applyLayout(
  nodes: Node[], 
  edges: Edge[],
  nodeSizes: Map<string, {width: number; height: number}>
) {
  Logger.debug('Starting layout calculation', {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeSizes,
  });

  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB',
    ranksep: 80,
    nodesep: 50,
    ranker: 'tight-tree'
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(node => {
    const size = nodeSizes.get(node.id)!;
    g.setNode(node.id, {
      width: Math.max(size.width, MIN_NODE_WIDTH),
      height: Math.max(size.height, MIN_NODE_HEIGHT)
    });
  });

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id);
    const size = nodeSizes.get(node.id)!;
    
    return {
      ...node,
      position: {
        x: pos.x - size.width / 2,
        y: pos.y - size.height / 2
      }
    };
  });
}