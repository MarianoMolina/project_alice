import { Build, Code } from "@mui/icons-material";
import { CodePermission, ToolPermission } from "../../../types/AgentTypes";
import { IconButton } from "@mui/material";

const getPermissionColor = (level: number): string => {
    switch (level) {
        case 1: return '#4CAF50'; // Green
        case 3: return '#FF9800'; // Orange
        case 2: return '#FFC107'; // Yellow
        case 0: return '#F44336'; // Red
        default: return '#757575'; // Grey
    }
};

export const getEnumKeyFromValue = (enumObj: any, value: number): string => {
    return Object.keys(enumObj).find(key => enumObj[key] === value) || 'UNKNOWN';
};

export const PermissionIcon: React.FC<{
    permission: number;
    type: 'tool' | 'code';
}> = ({ permission, type }) => {
    const Icon = type === 'tool' ? Build : Code;
    const enumObj = type === 'tool' ? ToolPermission : CodePermission;
    const permissionLabel = getEnumKeyFromValue(enumObj, permission);

    return (
        <IconButton size="small" title={`${type === 'tool' ? 'Tool' : 'Code'} Permission: ${permissionLabel}`}>
            <Icon sx={{ color: getPermissionColor(permission) }} />
        </IconButton>
    );
};