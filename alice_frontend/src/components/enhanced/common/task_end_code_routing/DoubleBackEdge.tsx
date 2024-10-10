import React from 'react';
import { EdgeProps } from 'reactflow';

const DoubleBackEdge: React.FC<EdgeProps> = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    label,
    labelStyle = {},
    style = {},
    markerEnd,
}) => {
    const rightOffset = 175; 
    const heightOffset = 110;

    // Calculate breakpoints
    const node0 = { x: sourceX, y: sourceY };
    const node1 = { x: sourceX + rightOffset, y: sourceY + heightOffset};
    const node2 = { x: sourceX + rightOffset, y: targetY - heightOffset};
    const node3 = { x: targetX, y: targetY };

    // Construct the path
    const path = `
        M ${node0.x},${node0.y}
        C ${node1.x},${node1.y} ${node2.x},${node2.y} ${node3.x},${node3.y}
    `;

    // Calculate label position (middle of the curve)
    const labelX = sourceX + 130;
    const labelY = (sourceY + targetY) / 2;

    // Label background dimensions
    const labelPadding = 4;
    const labelWidth = 10; // Adjust based on your typical label width
    const labelHeight = 20; // Adjust based on your typical label height

    return (
        <>
            <path
                fill="none"
                className="react-flow__edge-path"
                d={path}
                style={style}
                markerEnd={markerEnd}
            />
            {label && (
                <>
                    <rect
                        x={labelX - labelWidth / 2 - labelPadding}
                        y={labelY - labelHeight / 2 - labelPadding}
                        width={labelWidth + 2 * labelPadding}
                        height={labelHeight + 2 * labelPadding}
                        fill="white"
                        stroke="#555"
                        strokeWidth="1"
                        rx="3"
                        ry="3"
                    />
                    <text
                        x={labelX}
                        y={labelY}
                        style={{
                            fontSize: '12px',
                            fill: '#555',
                            fontWeight: 700,
                            ...labelStyle,
                        }}
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {label}
                    </text>
                </>
            )}
        </>
    );
};

export default DoubleBackEdge;