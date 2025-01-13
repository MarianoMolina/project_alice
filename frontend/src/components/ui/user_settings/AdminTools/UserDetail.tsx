import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Chip,
    Box,
    Paper,
} from '@mui/material';
import { User } from '../../../../types/UserTypes';
import { ApiConfigType, apiNameIcons } from '../../../../utils/ApiUtils';
import { ApiName } from '../../../../types/ApiTypes';

interface UserDetailProps {
    user: User;
    open: boolean;
    onClose: () => void;
}

export const UserDetail: React.FC<UserDetailProps> = ({
    user,
    open,
    onClose,
}) => {
    const renderApiConfigs = () => {
        const apiKeyMap = user.admin_tools?.api_key_map as ApiConfigType | undefined;

        if (!apiKeyMap) {
            return (
                <Typography color="textSecondary">
                    No API configurations set
                </Typography>
            );
        }

        return Object.entries(apiKeyMap).map(([apiName, config]) => (
            <Grid item xs={12} sm={6} key={apiName}>
                <Paper variant="outlined" sx={{ p: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        {apiNameIcons[apiName as ApiName]}
                        <Box>
                            <Typography variant="subtitle2">{apiName}</Typography>
                            <Chip
                                size="small"
                                label={Object.keys(config).length > 0 ? "Configured" : "Not Configured"}
                                color={Object.keys(config).length > 0 ? "success" : "default"}
                                variant={Object.keys(config).length > 0 ? "filled" : "outlined"}
                            />
                        </Box>
                    </Box>
                </Paper>
            </Grid>
        ));
    };

    const renderToolList = (tools: string[] | undefined) => {
        if (!tools || tools.length === 0) {
            return <Typography color="textSecondary">No tools configured</Typography>;
        }

        return (
            <Box display="flex" gap={1} flexWrap="wrap">
                {tools.map((tool, index) => (
                    <Chip
                        key={index}
                        label={tool}
                        size="small"
                        variant="outlined"
                    />
                ))}
            </Box>
        );
    };

    const renderCheckpoints = () => {
        const checkpoints = user.default_chat_config?.default_user_checkpoints;
        if (!checkpoints) {
            return <Typography color="textSecondary">No checkpoints configured</Typography>;
        }

        return Object.entries(checkpoints).map(([type, value]) => (
            <Grid item xs={12} key={type}>
                <Typography variant="body2">
                    {type}: <code>{value}</code>
                </Typography>
            </Grid>
        ));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                User Details
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Basic Information</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Name</Typography>
                                    <Typography>{user.name}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                                    <Typography>{user.email}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Role</Typography>
                                    <Chip label={user.role || 'user'} size="small" />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Chat Configuration</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Agent</Typography>
                                    <Typography>{user.default_chat_config?.alice_agent || 'Not set'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">Data Cluster</Typography>
                                    <Typography>{user.default_chat_config?.data_cluster || 'Not set'}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>API Configurations</Typography>
                            <Grid container spacing={2}>
                                {renderApiConfigs()}
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Tools</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Agent Tools
                                    </Typography>
                                    {renderToolList(user.default_chat_config?.agent_tools)}
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Retrieval Tools
                                    </Typography>
                                    {renderToolList(user.default_chat_config?.retrieval_tools)}
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Checkpoints</Typography>
                            <Grid container spacing={1}>
                                {renderCheckpoints()}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
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