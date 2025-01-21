import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AgentDescription from './AgentDescription';

interface AgentOverviewDialogProps {
    open: boolean;
    onClose: () => void;
}

const AgentOverviewDialog: React.FC<AgentOverviewDialogProps> = ({
    open,
    onClose,
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box className="flex items-center gap-2">
                        <Typography variant="h6">
                            'Agent Overview'
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <AgentDescription />
            </DialogContent>
        </Dialog>
    );
};

export default AgentOverviewDialog;