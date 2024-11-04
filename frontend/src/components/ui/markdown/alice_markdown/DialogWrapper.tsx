import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

interface DialogWrapperProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const DialogWrapper: React.FC<DialogWrapperProps> = ({ open, onClose, title, children }) => (
    <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
            className: 'p-4',
        }}
    >
        <DialogTitle className="flex justify-between items-center">
            <span>{title}</span>
            <IconButton onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
            </IconButton>
        </DialogTitle>
        <DialogContent>{children}</DialogContent>
    </Dialog>
);