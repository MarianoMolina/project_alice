import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
    Node,
    Edge,
    MarkerType,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    EdgeTypes,
    NodeTypes,
    ReactFlowInstance
} from 'reactflow';
import dagre from 'dagre';
import { Alert, Box, Typography } from '@mui/material';
import TaskNode from './TaskNode';
import SimpleTaskNode from './SimpleTaskNode';
import { getNodeData, isFullTask } from './FlowChartUtils';
import { AliceTask } from '../../../../../types/TaskTypes';
import SelfLoopEdge from '../SelfLoopEdge';
import DoubleBackEdge from '../DoubleBackEdge';
import useStyles from '../RoutingStyles';

interface FlowchartProps {
    task: Partial<AliceTask>;
}

const edgeTypes: EdgeTypes = {
    selfLoop: SelfLoopEdge,
    doubleBack: DoubleBackEdge,
};

const nodeTypes: NodeTypes = {
    taskNode: TaskNode,
    simpleNode: SimpleTaskNode,
};

const MIN_NODE_WIDTH = 300;
const MIN_NODE_HEIGHT = 150;

const Flowchart: React.FC<FlowchartProps> = ({ task }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [nodeSizes, setNodeSizes] = useState(new Map<string, { width: number; height: number }>());
    const [isInitialLayout, setIsInitialLayout] = useState(true);
    const flowInstance = useRef<ReactFlowInstance | null>(null);
    const classes = useStyles();

    const handleNodeSizeChange = useCallback((id: string, width: number, height: number) => {
        setNodeSizes(prev => {
            const newSizes = new Map(prev);
            newSizes.set(id, {
                width: Math.max(width, MIN_NODE_WIDTH),
                height: Math.max(height, MIN_NODE_HEIGHT)
            });
            return newSizes;
        });
    }, []);

    const createInitialNodes = useCallback(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const addedNodes = new Set<string>();

        const addNode = (nodeName: string) => {
            if (addedNodes.has(nodeName)) return;

            if (nodeName === "End") {
                nodes.push({
                    id: nodeName,
                    data: {
                        label: "End",
                        onSizeChange: handleNodeSizeChange
                    },
                    position: { x: 0, y: 0 },
                    className: 'bg-green-100 border-2 border-green-700 rounded p-2',
                });
            } else {
                const nodeData = getNodeData(task, nodeName);
                if (nodeData) {
                    nodes.push({
                        id: nodeName,
                        type: isFullTask(nodeData) ? 'taskNode' : 'simpleNode',
                        data: {
                            ...nodeData,
                            onSizeChange: handleNodeSizeChange
                        },
                        position: { x: 0, y: 0 },
                    });
                }
            }
            addedNodes.add(nodeName);
        };

        const addEdges = (sourceName: string) => {
            const routeMap = task.node_end_code_routing?.[sourceName];
            if (!routeMap) return;

            Object.entries(routeMap).forEach(([exitCode, [nextTask, isFailure]]) => {
                if (nextTask) {
                    if (nextTask === "End" || task.tasks?.[nextTask]) {
                        addNode(nextTask);

                        edges.push({
                            id: `${sourceName}-${nextTask}-${exitCode}`,
                            source: sourceName,
                            target: nextTask,
                            label: exitCode,
                            labelStyle: { fill: '#888', fontWeight: 700 },
                            type: nextTask === sourceName ? 'selfLoop' : 'default',
                            markerEnd: { type: MarkerType.ArrowClosed },
                            style: { stroke: isFailure ? '#FF0000' : '#00FF00', strokeWidth: 2 },
                        });
                    }
                }
            });
        };

        if (task.start_node) {
            addNode(task.start_node);
            const nodesAdded = new Set([task.start_node]);
            const nodesToProcess = [task.start_node];

            // Process all nodes and their connections
            while (nodesToProcess.length > 0) {
                const currentNode = nodesToProcess.shift()!;
                addEdges(currentNode);

                // Add new nodes to process queue
                const connections = task.node_end_code_routing?.[currentNode];
                if (connections) {
                    Object.values(connections).forEach(([nextNode]) => {
                        if (nextNode && !nodesAdded.has(nextNode)) {
                            nodesToProcess.push(nextNode);
                            nodesAdded.add(nextNode);
                        }
                    });
                }
            }
        }

        return { nodes, edges };
    }, [task, handleNodeSizeChange]);

    const applyLayout = useCallback((nodes: Node[], edges: Edge[], useExistingSizes = false) => {
        const g = new dagre.graphlib.Graph();
        g.setGraph({
            rankdir: 'TB',
            ranksep: 80,
            nodesep: 50,
            ranker: 'tight-tree'
        });
        g.setDefaultEdgeLabel(() => ({}));

        // Add nodes with their measured or minimum sizes
        nodes.forEach(node => {
            const size = useExistingSizes ? nodeSizes.get(node.id) : null;
            g.setNode(node.id, {
                width: size?.width || MIN_NODE_WIDTH,
                height: size?.height || MIN_NODE_HEIGHT
            });
        });

        edges.forEach(edge => {
            g.setEdge(edge.source, edge.target);
        });

        dagre.layout(g);

        return nodes.map(node => {
            const nodeWithPosition = g.node(node.id);
            const size = nodeSizes.get(node.id) || {
                width: MIN_NODE_WIDTH,
                height: MIN_NODE_HEIGHT
            };

            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - size.width / 2,
                    y: nodeWithPosition.y - size.height / 2
                }
            };
        });
    }, [nodeSizes]);

    // Initial setup
    useEffect(() => {
        const { nodes: initialNodes, edges: initialEdges } = createInitialNodes();
        setNodes(initialNodes);
        setEdges(initialEdges);
        setIsInitialLayout(true);
        setNodeSizes(new Map());
    }, [task, createInitialNodes]);

    // Apply layout once we have all node sizes
    useEffect(() => {
        if (!isInitialLayout) return;

        const allNodesHaveSizes = nodes.every(node =>
            nodeSizes.has(node.id)
        );

        if (allNodesHaveSizes && nodes.length > 0) {
            const layoutedNodes = applyLayout(nodes, edges, true);
            setNodes(layoutedNodes);
            setIsInitialLayout(false);

            // Center view after layout
            setTimeout(() => {
                flowInstance.current?.fitView({
                    padding: 0.2
                });
            }, 100);
        }
    }, [nodes, edges, nodeSizes, isInitialLayout, applyLayout]);

    if (!task?.node_end_code_routing || Object.keys(task.node_end_code_routing).length === 0) {
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
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                edgeTypes={edgeTypes}
                nodeTypes={nodeTypes}
                onInit={(instance) => {
                    flowInstance.current = instance;
                }}
                fitView
                attributionPosition="bottom-left"
                nodesConnectable={false}
                nodesDraggable={false}
                zoomOnScroll={true}
                panOnScroll={true}
                panOnDrag={true}
                zoomOnDoubleClick={false}
            >
                <Controls />
                <Background color="#aaa" gap={16} />
                <Typography variant="h6" sx={{ position: 'absolute', top: 10, left: 10, zIndex: 4 }}>
                    Node Flowchart
                </Typography>
            </ReactFlow>
        </Box>
    );
};

export default Flowchart;