import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Node, Edge, ReactFlowInstance } from 'reactflow';
import debounce from 'lodash/debounce';
import Logger from '../../../../../utils/Logger';
import { applyLayout } from '../utils/applyLayout';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  nodeSizes: Map<string, { width: number; height: number }>;
  isInitialLayoutComplete: boolean;
  isDragging: boolean;
  shouldFitView: boolean;
}

type FlowAction =
  | { type: 'SET_INITIAL'; nodes: Node[]; edges: Edge[] }
  | { type: 'UPDATE_SIZE'; id: string; width: number; height: number }
  | { type: 'UPDATE_LAYOUT'; nodes: Node[] }
  | { type: 'UPDATE_NODE_POSITION'; nodeId: string; position: { x: number; y: number }; isDragging: boolean }
  | { type: 'SET_DRAGGING'; isDragging: boolean }
  | { type: 'MARK_INITIAL_LAYOUT_COMPLETE' }
  | { type: 'SET_SHOULD_FIT_VIEW'; shouldFit: boolean };

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SET_INITIAL':
      Logger.debug('[FlowState] Setting initial state', {
        nodeCount: action.nodes.length,
        edgeCount: action.edges.length
      });
      return {
        nodes: action.nodes,
        edges: action.edges,
        nodeSizes: new Map(),
        isInitialLayoutComplete: false,
        isDragging: false,
        shouldFitView: true
      };

    case 'UPDATE_SIZE': {
      const newSizes = new Map(state.nodeSizes);
      newSizes.set(action.id, { width: action.width, height: action.height });
      return {
        ...state,
        nodeSizes: newSizes,
        isInitialLayoutComplete: false,
        shouldFitView: true
      };
    }

    case 'UPDATE_LAYOUT':
      return {
        ...state,
        nodes: action.nodes,
        shouldFitView: true
      };

    case 'UPDATE_NODE_POSITION': {
      // Allow position updates during dragging and after layout is complete
      if (!state.isInitialLayoutComplete && !action.isDragging) return state;
      
      const updatedNodes = state.nodes.map(node =>
        node.id === action.nodeId
          ? { ...node, position: action.position }
          : node
      );
      
      return {
        ...state,
        nodes: updatedNodes,
        // Only fit view if this is not a drag update
        shouldFitView: !action.isDragging
      };
    }

    case 'SET_DRAGGING':
      return {
        ...state,
        isDragging: action.isDragging
      };

    case 'MARK_INITIAL_LAYOUT_COMPLETE':
      return {
        ...state,
        isInitialLayoutComplete: true,
        shouldFitView: false
      };

    case 'SET_SHOULD_FIT_VIEW':
      return {
        ...state,
        shouldFitView: action.shouldFit
      };

    default:
      return state;
  }
}

export function useEnhancedFlowState() {
  const [state, dispatch] = useReducer(flowReducer, {
    nodes: [],
    edges: [],
    nodeSizes: new Map(),
    isInitialLayoutComplete: false,
    isDragging: false,
    shouldFitView: false
  });

  const routingSignatureRef = useRef<string>();
  const layoutTimeoutRef = useRef<NodeJS.Timeout>();
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const setFlowInstance = useCallback((instance: ReactFlowInstance) => {
    flowInstanceRef.current = instance;
  }, []);

  const setInitial = useCallback((nodes: Node[], edges: Edge[]) => {
    dispatch({ type: 'SET_INITIAL', nodes, edges });
  }, []);

  const updateSize = useCallback((id: string, width: number, height: number) => {
    dispatch({ type: 'UPDATE_SIZE', id, width, height });
  }, []);

  const updateLayout = useCallback((nodes: Node[]) => {
    dispatch({ type: 'UPDATE_LAYOUT', nodes });
  }, []);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }, isDragging: boolean = false) => {
    dispatch({ type: 'UPDATE_NODE_POSITION', nodeId, position, isDragging });
  }, []);

  const setDragging = useCallback((isDragging: boolean) => {
    dispatch({ type: 'SET_DRAGGING', isDragging });
  }, []);

  const markInitialLayoutComplete = useCallback(() => {
    dispatch({ type: 'MARK_INITIAL_LAYOUT_COMPLETE' });
  }, []);

  const fitView = useCallback(() => {
    if (flowInstanceRef.current) {
      Logger.debug('[useEnhancedFlowState] Fitting view');
      flowInstanceRef.current.fitView({ padding: 0.2, duration: 200 });
      dispatch({ type: 'SET_SHOULD_FIT_VIEW', shouldFit: false });
    }
  }, []);

  // Debounced layout update with view fitting
  const debouncedLayoutUpdate = useCallback(
    debounce((nodes: Node[], edges: Edge[], nodeSizes: Map<string, { width: number; height: number }>) => {
      Logger.debug('[useEnhancedFlowState] Running debounced layout update', {
        nodeCount: nodes.length,
        sizesCount: nodeSizes.size
      });
      
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }

      const allSized = nodes.length > 0 && nodes.every(node => nodeSizes.has(node.id));
      if (!allSized) return;

      const layoutedNodes = applyLayout(nodes, edges, nodeSizes);
      updateLayout(layoutedNodes);

      requestAnimationFrame(() => {
        layoutTimeoutRef.current = setTimeout(() => {
          markInitialLayoutComplete();
          if (flowInstanceRef.current) {
            fitView();
          }
        }, 100);
      });
    }, 150
  ), [updateLayout, markInitialLayoutComplete, fitView]);

  const handleRoutingChange = useCallback((routingSignature: string, nodes: Node[], edges: Edge[]) => {
    if (routingSignatureRef.current !== routingSignature) {
      Logger.debug('[useEnhancedFlowState] Routing changed, updating flow', {
        previousSignature: routingSignatureRef.current,
        newSignature: routingSignature
      });
      
      routingSignatureRef.current = routingSignature;
      setInitial(nodes, edges);
    }
  }, [setInitial]);

  useEffect(() => {
    if (state.shouldFitView && flowInstanceRef.current) {
      fitView();
    }
  }, [state.shouldFitView, fitView]);

  useEffect(() => {
    return () => {
      debouncedLayoutUpdate.cancel();
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, [debouncedLayoutUpdate]);

  return {
    state,
    setInitial,
    updateSize,
    updateNodePosition,
    setDragging,
    handleRoutingChange,
    debouncedLayoutUpdate,
    setFlowInstance,
    fitView
  };
}