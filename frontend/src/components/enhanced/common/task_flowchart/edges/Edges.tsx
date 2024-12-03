import { EdgeProps, } from 'reactflow';
import Logger from '../../../../../utils/Logger';

// Constants for edge positioning
const EXIT_CODE_WIDTH = 16; // Width of each exit code tag
const EXIT_CODE_MARGIN = 8; // Margin between exit code tags
export const nodeWidth = 430;
export const nodeHeight = 105;
const horizontalPadding = 350;

interface EdgeData {
    exitCode: string;
    exitCodes: string[];
    totalExitCodes: number;
}

// Helper function to calculate the source point offset
const calculateSourceOffset = (exitCode: string, exitCodes: string[]): number => {
    Logger.debug('[Edge:calculateSourceOffset] Input', {
        exitCode,
        exitCodes,
        parsedExitCode: parseInt(exitCode)
    });

    const index = parseInt(exitCode);
    const totalCodes = exitCodes.length;
    const totalWidth = (totalCodes * EXIT_CODE_WIDTH) + ((totalCodes - 1) * EXIT_CODE_MARGIN);
    const step = totalWidth / (totalCodes - 1);
    const offset = -totalWidth / 2 + (index * step);

    return offset;
};

export const DistributedSelfLoopEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    label,
    labelStyle = {},
    style = {},
    markerEnd,
    data
}: EdgeProps<EdgeData>) => {


    if (!data?.exitCode || !data?.exitCodes) {
        Logger.warn('[Edge:SelfLoop] Missing required data', { id, data });
        return null;
    }

    const xOffset = calculateSourceOffset(data.exitCode, data.exitCodes);
    const adjustedSourceX = sourceX + xOffset;

    Logger.debug('[Edge:SelfLoop] Position calculation', {
        id,
        exitCode: data.exitCode,
        originalX: sourceX,
        offset: xOffset,
        adjustedX: adjustedSourceX
    });

    const higherY = Math.max(targetY, sourceY);
    const lowerY = Math.min(targetY, sourceY);
    const verticalOffset = (higherY - lowerY) / 2;
    const horizontalOffset = nodeWidth / 2 + horizontalPadding;
    // const labelOffset = nodeWidth / 2 + 120;

    const path = `M ${adjustedSourceX},${sourceY} C ${adjustedSourceX - horizontalOffset},${sourceY + verticalOffset} ${adjustedSourceX - horizontalOffset},${targetY - verticalOffset} ${targetX},${targetY}`;

    Logger.debug('[Edge:SelfLoop] Generated path', {
        id,
        path,
        adjustment: {
            verticalOffset,
            horizontalOffset
        }
    });

    return (
        <>
            <path
                fill="none"
                className="react-flow__edge-path"
                d={path}
                style={style}
                markerEnd={markerEnd}
            />
        </>
    );
};

export const DistributedDoubleBackEdge = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    label,
    labelStyle = {},
    style = {},
    markerEnd,
    data
}: EdgeProps<EdgeData>) => {
    Logger.debug('[Edge:Doubleback] Processing edge data', {
        sourceX,
        sourceY,
        data
    });

    if (!data?.exitCode || !data?.exitCodes) {
        Logger.warn('[Edge:Doubleback] Missing data, using fallback edge', { data });
        return (
            <path
                fill="none"
                className="react-flow__edge-path"
                d={`M ${sourceX},${sourceY} C ${sourceX},${sourceY} ${targetX},${targetY} ${targetX},${targetY}`}
                style={style}
                markerEnd={markerEnd}
            />
        );
    }

    const index = parseInt(data.exitCode);
    const totalCodes = data.exitCodes.length;
    const totalWidth = (totalCodes * EXIT_CODE_WIDTH) + ((totalCodes - 1) * EXIT_CODE_MARGIN);
    const step = totalWidth / (totalCodes - 1);
    const xOffset = -totalWidth / 2 + (index * step);
    const adjustedSourceX = sourceX + xOffset;

    const horizontalOffset = nodeWidth * 2 + horizontalPadding*2;

    const path = `M ${adjustedSourceX},${sourceY} C ${adjustedSourceX - horizontalOffset},${sourceY + nodeHeight / 2} ${adjustedSourceX - horizontalOffset},${targetY - nodeHeight / 2} ${targetX},${targetY}`;

    Logger.debug('[Edge:Doubleback] Generated path', { path });

    return (
        <>
            <path
                fill="none"
                className="react-flow__edge-path"
                d={path}
                style={style}
                markerEnd={markerEnd}
            />
        </>
    );
};
export const DistributedDefaultEdge = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    label,
    labelStyle = {},
    style = {},
    markerEnd,
    data
}: EdgeProps<EdgeData>) => {
    Logger.debug('[DefaultEdge] Processing edge data', {
        sourceX,
        sourceY,
        data
    });

    if (!data?.exitCode || !data?.exitCodes) {
        Logger.warn('[DefaultEdge] Missing data, using fallback edge', { data });
        return (
            <path
                fill="none"
                className="react-flow__edge-path"
                d={`M ${sourceX},${sourceY} C ${sourceX},${sourceY} ${targetX},${targetY} ${targetX},${targetY}`}
                style={style}
                markerEnd={markerEnd}
            />
        );
    }

    const index = parseInt(data.exitCode);
    const totalCodes = data.exitCodes.length;
    const totalWidth = (totalCodes * EXIT_CODE_WIDTH) + ((totalCodes - 1) * EXIT_CODE_MARGIN);
    const step = totalWidth / (totalCodes - 1);
    const xOffset = -totalWidth / 2 + (index * step);
    const adjustedSourceX = sourceX + xOffset;

    // For default edge, we just need a simple bezier curve from adjusted source to target
    const path = `M ${adjustedSourceX},${sourceY} C ${adjustedSourceX},${sourceY + 50} ${targetX},${targetY - 50} ${targetX},${targetY}`;

    return (
        <>
            <path
                fill="none"
                className="react-flow__edge-path"
                d={path}
                style={style}
                markerEnd={markerEnd}
            />
        </>
    );
};