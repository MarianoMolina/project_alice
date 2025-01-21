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
import ChatDescription from './ChatDescription';

interface ChatDescriptionDialogProps {
    open: boolean;
    onClose: () => void;
}

const ChatDescriptionDialog: React.FC<ChatDescriptionDialogProps> = ({
    open,
    onClose,
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box className="flex items-center gap-2">
                        <Typography variant="h6">
                            Chat Overview
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <ChatDescription />
            </DialogContent>
        </Dialog>
    );
};

export default ChatDescriptionDialog;