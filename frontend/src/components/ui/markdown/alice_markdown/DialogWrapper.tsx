import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

interface DialogWrapperProps {
    open: boolean;
    onClose: () => void;
    title: string;
    caption?: string;
    children: React.ReactNode;
}

export const DialogWrapper: React.FC<DialogWrapperProps> = ({ open, onClose, title, children, caption }) => (
    <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
    >
        <DialogTitle className="flex justify-between items-center" sx={{padding: '8px'}}>
            <Box>
                <Typography variant="h6">{title}</Typography>

                <Typography variant="body2" className="text-gray-400">
                    {caption}
                </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
            </IconButton>
        </DialogTitle>
        <DialogContent sx={{padding:0}}>{children}</DialogContent>
    </Dialog>
);