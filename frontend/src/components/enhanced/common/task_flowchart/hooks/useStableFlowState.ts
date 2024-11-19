import { useReducer, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import Logger from '../../../../../utils/Logger';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  nodeSizes: Map<string, {width: number; height: number}>;
  layoutComplete: boolean;
}

type FlowAction = 
  | { type: 'SET_INITIAL', nodes: Node[], edges: Edge[] }
  | { type: 'UPDATE_SIZE', id: string, width: number, height: number }
  | { type: 'UPDATE_LAYOUT', nodes: Node[] }
  | { type: 'MARK_LAYOUT_COMPLETE' };

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SET_INITIAL':
      Logger.debug('[FlowState] Setting initial state', {
        nodeCount: action.nodes.length,
        edgeCount: action.edges.length,
        positions: action.nodes.map(n => ({ id: n.id, pos: n.position }))
      });
      return {
        nodes: action.nodes,
        edges: action.edges,
        nodeSizes: new Map(),
        layoutComplete: false
      };
    
    case 'UPDATE_SIZE':
      const newSizes = new Map(state.nodeSizes);
      newSizes.set(action.id, {width: action.width, height: action.height});
      Logger.debug('[FlowState] Updated size', {
        id: action.id,
        width: action.width,
        height: action.height,
        totalSizes: newSizes.size,
        nodeCount: state.nodes.length,
        layoutComplete: state.layoutComplete
      });
      return {
        ...state,
        nodeSizes: newSizes,
        layoutComplete: false
      };
    
    case 'UPDATE_LAYOUT':
      Logger.debug('[FlowState] Updating layout', {
        nodeCount: action.nodes.length,
        positions: action.nodes.map(n => ({ id: n.id, pos: n.position }))
      });
      return {
        ...state,
        nodes: action.nodes
      };
    
    case 'MARK_LAYOUT_COMPLETE':
      Logger.debug('[FlowState] Marking layout complete', {
        nodeCount: state.nodes.length,
        positions: state.nodes.map(n => ({ id: n.id, pos: n.position }))
      });
      return {
        ...state,
        layoutComplete: true
      };
  }
}

export function useStableFlowState() {
  const [state, dispatch] = useReducer(flowReducer, {
    nodes: [],
    edges: [],
    nodeSizes: new Map(),
    layoutComplete: false
  });

  const setInitial = useCallback((nodes: Node[], edges: Edge[]) => {
    dispatch({ type: 'SET_INITIAL', nodes, edges });
  }, []);

  const updateSize = useCallback((id: string, width: number, height: number) => {
    dispatch({ type: 'UPDATE_SIZE', id, width, height });
  }, []);

  const updateLayout = useCallback((nodes: Node[]) => {
    dispatch({ type: 'UPDATE_LAYOUT', nodes });
  }, []);

  const markLayoutComplete = useCallback(() => {
    dispatch({ type: 'MARK_LAYOUT_COMPLETE' });
  }, []);

  return {
    state,
    setInitial,
    updateSize,
    updateLayout,
    markLayoutComplete
  };
}