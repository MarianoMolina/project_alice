import React, { useState } from 'react';
import {
    Button,
    Typography,
    Paper,
    IconButton,
    Box,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';

interface UserDetailCardProps {
    title: string;
    children: (isEditing: boolean) => React.ReactNode;
    canEdit?: boolean;
    initialEditState?: boolean;
    onSave?: () => Promise<void>;
}

export const UserDetailCard: React.FC<UserDetailCardProps> = ({
    title,
    children,
    canEdit = false,
    initialEditState = false,
    onSave
}) => {
    const [isEditing, setIsEditing] = useState<boolean>(initialEditState);

    const handleEdit = (): void => setIsEditing(true);
    const handleSave = async (): Promise<void> => {
        if (onSave) {
            await onSave();
            setIsEditing(false);
        }
    };

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{title}</Typography>
                {canEdit && (
                    isEditing ? (
                        <Button
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            color="primary"
                            variant="contained"
                            size="small"
                        >
                            Save
                        </Button>
                    ) : (
                        <IconButton onClick={handleEdit} size="small" color="primary">
                            <EditIcon />
                        </IconButton>
                    )
                )}
            </Box>
            {children(isEditing)}
        </Paper>
    );
};