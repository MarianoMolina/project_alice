import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  EdgeTypes,
  NodeTypes,
  OnNodesChange,
  NodeDragHandler,
  ReactFlowInstance,
  MiniMap,
} from 'reactflow';
import { Alert, Box, FormControl, InputLabel, Typography } from '@mui/material';
import TaskNode from './nodes/TaskNode';
import SimpleTaskNode from './nodes/SimpleTaskNode';
import { useEnhancedFlowState } from './hooks/useStableFlowState';
import { createNodes } from './utils/createNodes';
import EndNode from './nodes/EndNode';
import { PopulatedTask } from '../../../../types/TaskTypes';
import 'reactflow/dist/style.css';
import { DistributedDefaultEdge, DistributedDoubleBackEdge, DistributedSelfLoopEdge } from './edges/Edges';
import theme from '../../../../Theme';

interface FlowchartProps {
  task: Partial<PopulatedTask>;
  title?: string;
  height?: string | number;
  width?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
  miniMap?: boolean;
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
  title = 'Node Flowchart',
  height = '1000px',
  width = '100%',
  minWidth = '500px',
  minHeight = '500px',
  miniMap = false
}) => {

  const {
    state: { nodes, edges, nodeSizes, isInitialLayoutComplete, isDragging, shouldFitView },
    updateSize,
    updateNodePosition,
    setDragging,
    handleRoutingChange,
    debouncedLayoutUpdate,
    setFlowInstance
  } = useEnhancedFlowState();

  // Handle routing changes
  useEffect(() => {
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
    setDragging(true);
  }, [setDragging]);

  const onNodeDragStop: NodeDragHandler = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  // Trigger layout updates when necessary
  useEffect(() => {
    if (!isInitialLayoutComplete && nodes.length > 0) {
      debouncedLayoutUpdate(nodes, edges, nodeSizes);
    }
  }, [nodes, edges, nodeSizes, isInitialLayoutComplete, debouncedLayoutUpdate]);

  // Initialize ReactFlow instance
  const onInit = useCallback((instance: ReactFlowInstance) => {
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
        <Typography variant="h6">{title}</Typography>
        <Alert severity="info" sx={{ width: '100%', marginTop: 10 }}>
          No tasks found to build the flowchart.
        </Alert>
      </Box>
    );
  }

  return (
    <FormControl fullWidth variant="outlined" sx={{ marginTop: 1, marginBottom: 1 }}>
      <InputLabel shrink sx={{ backgroundColor: theme.palette.primary.dark }}>{title}</InputLabel>
      <div className="relative p-4 border border-gray-200/60 rounded-lg ml-2 mr-2">
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
            nodesDraggable={true}
            zoomOnScroll={true}
            panOnScroll={true}
            panOnDrag={true}
            zoomOnDoubleClick={true}
          >
            {miniMap &&
              <MiniMap />
            }
            <Controls />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </Box>
      </div>
    </FormControl>
  );
};

export default Flowchart;