import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    MarkerType,
    useNodesState,
    useEdgesState,
    Controls,
    Position,
    Background,
    EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Box, Typography } from '@mui/material';
import { TasksEndCodeRouting } from '../../../../types/TaskTypes';
import SelfLoopEdge from './SelfLoopEdge';
import DoubleBackEdge from './DoubleBackEdge';

interface FlowchartProps {
    tasksEndCodeRouting: TasksEndCodeRouting;
    startTask: string;
}

const edgeTypes: EdgeTypes = {
    selfLoop: SelfLoopEdge,
    doubleBack: DoubleBackEdge,
};

const nodeWidth = 180;
const nodeHeight = 40;

const Flowchart: React.FC<FlowchartProps> = ({ tasksEndCodeRouting, startTask }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const getLayoutedElements = useCallback(
        (nodes: Node[], edges: Edge[], direction = 'TB') => {
            const dagreGraph = new dagre.graphlib.Graph();
            dagreGraph.setDefaultEdgeLabel(() => ({}));

            dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 100 });

            nodes.forEach((node) => {
                dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
            });

            edges.forEach((edge) => {
                dagreGraph.setEdge(edge.source, edge.target);
            });

            dagre.layout(dagreGraph);

            const layoutedNodes = nodes.map((node) => {
                const nodeWithPosition = dagreGraph.node(node.id);
                return {
                    ...node,
                    position: {
                        x: nodeWithPosition.x - nodeWidth / 2,
                        y: nodeWithPosition.y - nodeHeight / 2,
                    },
                };
            });

            const layoutedEdges = edges.map((edge) => {
                const sourceNode = layoutedNodes.find(n => n.id === edge.source);
                const targetNode = layoutedNodes.find(n => n.id === edge.target);

                if (sourceNode && targetNode) {
                    const isBackEdge = sourceNode.position.y > targetNode.position.y;
                    const isSelfLoop = edge.source === edge.target;

                    if (isSelfLoop) {
                        return {
                            ...edge,
                            type: 'selfLoop',
                            sourceHandle: 'bottom',
                            targetHandle: 'top',
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                            },
                        };
                    } else if (isBackEdge) {
                        return {
                            ...edge,
                            type: 'doubleBack',
                            sourceHandle: 'right',
                            targetHandle: 'right',
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                            },
                        };
                    }
                }

                return edge;
            });

            return { nodes: layoutedNodes, edges: layoutedEdges };
        },
        []
    );
    useEffect(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const addedNodes = new Set<string>();
        const processedTasks = new Set<string>();

        const addNode = (taskName: string, isEndNode: boolean = false) => {
            if (!addedNodes.has(taskName)) {
                nodes.push({
                    id: taskName,
                    data: { label: taskName },
                    position: { x: 0, y: 0 },
                    style: { 
                        width: nodeWidth, 
                        height: nodeHeight, 
                        padding: 10,
                        backgroundColor: isEndNode ? '#90EE90' : undefined, // Light green for end node
                        border: isEndNode ? '2px solid #2E8B57' : undefined // Dark green border for end node
                    },
                    targetPosition: Position.Top,
                    sourcePosition: Position.Bottom,
                });
                addedNodes.add(taskName);
            }
        };
        addNode("End", true);
        const processTask = (taskName: string) => {
            if (processedTasks.has(taskName)) {
                return;
            }

            addNode(taskName);
            processedTasks.add(taskName);

            const routeMap = tasksEndCodeRouting[taskName];

            if (!routeMap || Object.keys(routeMap).length === 0) {
                return;
            }

            Object.entries(routeMap).forEach(([exitCode, [nextTask, isFailure]]) => {
                if (nextTask !== null) {
                    addNode(nextTask);
                    edges.push({
                        id: `${taskName}-${nextTask}-${exitCode}`,
                        source: taskName,
                        target: nextTask,
                        label: exitCode,
                        labelStyle: { fill: '#888', fontWeight: 700 },
                        type: 'smoothstep',
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                        },
                        style: { stroke: isFailure ? '#FF0000' : '#00FF00', strokeWidth: 2 },
                    });
                    if (!processedTasks.has(nextTask)) {
                        processTask(nextTask);
                    }
                } else {
                    // Handle the case where nextTask is null (end of workflow)
                    edges.push({
                        id: `${taskName}-End-${exitCode}`,
                        source: taskName,
                        target: "End",
                        label: exitCode,
                        labelStyle: { fill: '#888', fontWeight: 700 },
                        type: 'smoothstep',
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                        },
                        style: { stroke: isFailure ? '#FF0000' : '#00FF00', strokeWidth: 2 },
                    });
                }
            });
        };

        processTask(startTask);

        // Process any remaining tasks that weren't reached from the start task
        Object.keys(tasksEndCodeRouting).forEach(taskName => {
            if (!processedTasks.has(taskName)) {
                processTask(taskName);
            }
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [tasksEndCodeRouting, startTask, getLayoutedElements]);

    return (
        <Box sx={{ width: '100%', height: '800px' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                edgeTypes={edgeTypes}
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
                    Workflow Flowchart
                </Typography>
            </ReactFlow>
        </Box>
    );
};

export default Flowchart;