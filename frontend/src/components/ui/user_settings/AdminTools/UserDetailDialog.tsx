import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';
import { User, } from '../../../../types/UserTypes';
import UserDetail from '../../../enhanced/user/UserDetail';

interface UserDetailProps {
    user: User;
    open: boolean;
    onClose: () => void;
    canToggleEdit?: boolean;
}

export const UserDetailDialog: React.FC<UserDetailProps> = ({
    user,
    open,
    onClose,
    canToggleEdit = false,
}) => {

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                User Details
            </DialogTitle>
            <DialogContent>
                <UserDetail
                    user={user}
                    canToggleEdit={canToggleEdit}
                    initialEditState={false}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserDetail;