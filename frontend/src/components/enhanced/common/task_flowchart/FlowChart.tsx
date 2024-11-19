import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  EdgeTypes,
  NodeTypes,
  OnNodesChange,
  NodeDragHandler,
  ReactFlowInstance,
} from 'reactflow';
import { Alert, Box, Typography } from '@mui/material';
import TaskNode from './nodes/TaskNode';
import SimpleTaskNode from './nodes/SimpleTaskNode';
import { useEnhancedFlowState } from './hooks/useStableFlowState';
import { createNodes } from './utils/createNodes';
import EndNode from './nodes/EndNode';
import useStyles from './FlowChartStyles';
import { AliceTask } from '../../../../types/TaskTypes';
import 'reactflow/dist/style.css';
import { DistributedDefaultEdge, DistributedDoubleBackEdge, DistributedSelfLoopEdge } from './edges/Edges';
import Logger from '../../../../utils/Logger';

interface FlowchartProps {
  task: Partial<AliceTask>;
  height?: string | number;
  width?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
}

const edgeTypes: EdgeTypes = {
  selfLoop: DistributedSelfLoopEdge,
  doubleBack: DistributedDoubleBackEdge,
  distributedDefault: DistributedDefaultEdge,
};

const nodeTypes: NodeTypes = {
  taskNode: TaskNode,
  simpleNode: SimpleTaskNode,
  endNode: EndNode,
};

const Flowchart: React.FC<FlowchartProps> = ({ 
  task, 
  height = '1000px',
  width = '100%',
  minWidth = '500px',
  minHeight = '500px'
}) => {
  const classes = useStyles();

  const {
    state: { nodes, edges, nodeSizes, isInitialLayoutComplete, isDragging, shouldFitView },
    updateSize,
    updateNodePosition,
    setDragging,
    handleRoutingChange,
    debouncedLayoutUpdate,
    setFlowInstance
  } = useEnhancedFlowState();

  // Log key state changes
  useEffect(() => {
    Logger.debug('[FlowChart] State update', {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      sizedNodes: nodeSizes.size,
      isInitialLayoutComplete,
      isDragging,
      shouldFitView,
      taskId: task._id,
    });
  }, [nodes.length, edges.length, nodeSizes.size, isInitialLayoutComplete, isDragging, shouldFitView, task._id]);

  // Handle routing changes
  useEffect(() => {
    Logger.debug('[FlowChart] Checking routing changes', {
      taskId: task._id,
      hasRouting: !!task.node_end_code_routing,
      nodeCount: Object.keys(task.node_end_code_routing || {}).length
    });

    const { nodes: newNodes, edges: newEdges } = createNodes(task, updateSize);
    const routingSignature = JSON.stringify(task.node_end_code_routing);
    handleRoutingChange(routingSignature, newNodes, newEdges);
  }, [task, handleRoutingChange, updateSize]);

  // Handle node position changes
  const onNodesChange: OnNodesChange = useCallback(changes => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        // Pass isDragging state to differentiate between drag updates and other position changes
        updateNodePosition(change.id, change.position, isDragging);
      }
    });
  }, [updateNodePosition, isDragging]);

  // Handle node drag events
  const onNodeDragStart: NodeDragHandler = useCallback(() => {
    Logger.debug('[FlowChart] Node drag started');
    setDragging(true);
  }, [setDragging]);

  const onNodeDragStop: NodeDragHandler = useCallback(() => {
    Logger.debug('[FlowChart] Node drag stopped');
    setDragging(false);
  }, [setDragging]);

  // Trigger layout updates when necessary
  useEffect(() => {
    if (!isInitialLayoutComplete && nodes.length > 0) {
      Logger.debug('[FlowChart] Layout update check', {
        nodeCount: nodes.length,
        sizedNodes: nodeSizes.size,
        allNodesHaveSizes: nodes.every(node => nodeSizes.has(node.id))
      });
      debouncedLayoutUpdate(nodes, edges, nodeSizes);
    }
  }, [nodes, edges, nodeSizes, isInitialLayoutComplete, debouncedLayoutUpdate]);

  // Initialize ReactFlow instance
  const onInit = useCallback((instance: ReactFlowInstance) => {
    Logger.debug('[FlowChart] Flow instance initialized');
    setFlowInstance(instance);
  }, [setFlowInstance]);

  const containerStyle = {
    height,
    width,
    minWidth,
    minHeight,
    flexGrow: 1,
    flexBasis: minWidth
  };

  if (!task?.node_end_code_routing || Object.keys(task.node_end_code_routing).length === 0) {
    return (
      <Box sx={containerStyle}>
        <Typography variant="h6">Node Flowchart</Typography>
        <Alert severity="info" sx={{ width: '100%', marginTop: 10 }}>
          No tasks found to build the flowchart.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={containerStyle}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
        onInit={onInit}
        onNodesChange={onNodesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        fitView={shouldFitView}
        fitViewOptions={{ padding: 0.2, duration: 200 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        nodesConnectable={false}
        nodesDraggable={true} // Always allow dragging
        zoomOnScroll={true}
        panOnScroll={true}
        panOnDrag={true}
        zoomOnDoubleClick={true}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </Box>
  );
};

export default Flowchart;