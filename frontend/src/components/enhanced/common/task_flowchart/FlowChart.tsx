import React, { useEffect, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  EdgeTypes,
  NodeTypes,
  ReactFlowInstance
} from 'reactflow';
import { Alert, Box, Typography } from '@mui/material';
import TaskNode from './nodes/TaskNode';
import SimpleTaskNode from './nodes/SimpleTaskNode';
import { useStableFlowState } from './hooks/useStableFlowState';
import { createNodes } from './utils/createNodes';
import { applyLayout } from './utils/applyLayout';
import EndNode from './nodes/EndNode';
import useStyles from './FlowChartStyles';
import { AliceTask } from '../../../../types/TaskTypes';
import Logger from '../../../../utils/Logger';
import 'reactflow/dist/style.css';
import { DistributedDefaultEdge, DistributedDoubleBackEdge, DistributedSelfLoopEdge } from './edges/Edges';

interface FlowchartProps {
  task: Partial<AliceTask>;
}

interface FlowchartProps {
  task: Partial<AliceTask>;
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

const Flowchart: React.FC<FlowchartProps> = ({ task }) => {
  const flowInstance = useRef<ReactFlowInstance | null>(null);
  const classes = useStyles();
  const prevTaskRef = useRef<Partial<AliceTask>>();
  
  const {
    state: { nodes, edges, nodeSizes, layoutComplete },
    setInitial,
    updateSize,
    updateLayout,
    markLayoutComplete
  } = useStableFlowState();

  // Track task prop changes
  useEffect(() => {
    const taskChanged = task !== prevTaskRef.current;
    Logger.debug('[FlowChart] Task prop change', {
      taskId: task._id,
      prevTaskId: prevTaskRef.current?._id,
      hasChanged: taskChanged,
      routingKeys: Object.keys(task.node_end_code_routing || {}),
      nodeCount: nodes.length
    });
    prevTaskRef.current = task;
  }, [task, nodes.length]);

  // Track node creation
  useEffect(() => {
    Logger.debug('[FlowChart] Creating nodes effect', { 
      taskId: task._id,
      nodeCount: nodes.length,
      existingNodeSizes: Array.from(nodeSizes.entries()).map(([id, size]) => ({
        id,
        size
      }))
    });
    const initialState = createNodes(task, updateSize);
    setInitial(initialState.nodes, initialState.edges);
  }, [task, setInitial, updateSize]);

  // Track layout updates
  useEffect(() => {
    if (layoutComplete || nodes.length === 0) {
      Logger.debug('[FlowChart] Layout effect skipped', {
        layoutComplete,
        nodeCount: nodes.length,
        sizedNodesCount: nodeSizes.size
      });
      return;
    }

    const allSized = nodes.every(node => nodeSizes.has(node.id));
    Logger.debug('[FlowChart] Checking layout readiness', {
      nodeCount: nodes.length,
      sizedCount: nodeSizes.size,
      allSized,
      layoutComplete,
      sizes: Array.from(nodeSizes.entries()).map(([id, size]) => ({
        id,
        size
      }))
    });

    if (allSized) {
      Logger.debug('[FlowChart] Starting layout calculation');
      const layoutedNodes = applyLayout(nodes, edges, nodeSizes);
      Logger.debug('[FlowChart] Layout calculated', {
        nodePositions: layoutedNodes.map(n => ({
          id: n.id,
          position: n.position
        }))
      });
      updateLayout(layoutedNodes);
      markLayoutComplete();
      
      // Fit view after layout is updated
      setTimeout(() => {
        flowInstance.current?.fitView({
          padding: 0.2,
          includeHiddenNodes: false,
          duration: 200
        });
      }, 50);
    }
  }, [nodes, edges, nodeSizes, layoutComplete, updateLayout, markLayoutComplete]);

  if (!task?.node_end_code_routing || Object.keys(task.node_end_code_routing).length === 0) {
    Logger.warn('No routing information found for task');
    return (
      <Box className={classes.flowChartContainer}>
        <Typography variant="h6">Node Flowchart</Typography>
        <Alert severity="info" sx={{ width: '100%', marginTop: 10 }}>
          No tasks found to build the flowchart.
        </Alert>
      </Box>
    );
  }

  return (
    <Box className={classes.flowChartContainer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          flowInstance.current = instance;
          Logger.debug('Flow instance initialized');
          // Initial fit view
          instance.fitView({
            padding: 0.2,
            includeHiddenNodes: false,
            duration: 200
          });
        }}
        fitView={false}
        attributionPosition="bottom-left"
        nodesConnectable={false}
        nodesDraggable={true}
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