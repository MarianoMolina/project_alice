import React, { useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Warning } from '@mui/icons-material';
import useStyles from '../../../styles/UserSettingsStyles';
import { useDialog } from '../../../contexts/DialogCustomContext';
import { useApi } from '../../../contexts/ApiContext';
import { useNotification } from '../../../contexts/NotificationContext';
import Logger from '../../../utils/Logger';

const DangerZone: React.FC = () => {
    const classes = useStyles();
    const { openDialog } = useDialog();
    const { purgeAndReinitializeDatabase } = useApi();
    const { addNotification } = useNotification();

    const handlePurgeAndReinitialize = useCallback(() => {
        Logger.info('handlePurgeAndReinitialize called');
        openDialog({
            title: 'Confirm Database Purge and Reinitialization',
            content: 'Are you sure you want to purge and reinitialize your database? This action cannot be undone and will delete all your current data.',
            buttons: [
                {
                    text: 'Cancel',
                    action: () => {
                        addNotification('Database reinitialization cancelled', 'info');
                    },
                    color: 'primary',
                },
                {
                    text: 'Confirm Purge and Reinitialize',
                    action: async () => {
                        Logger.debug('Dialog confirmed');
                        try {
                            Logger.info('Purging db');
                            await purgeAndReinitializeDatabase();
                            Logger.info('Database successfully purged and reinitialized');
                            addNotification('Database successfully purged and reinitialized', 'success');
                            window.location.reload();
                        } catch (error) {
                            Logger.error('Failed to purge and reinitialize database:', error);
                            addNotification('Failed to purge and reinitialize database. Please try again.', 'error');
                        }
                    },
                    color: 'error',
                    variant: 'contained',
                },
            ],
        });
    }, [openDialog, purgeAndReinitializeDatabase, addNotification]);

    return (
        <Card className={classes.card}>
            <CardContent>
                <Box className={classes.dangerZone}>
                    <Box className={classes.userInfoHeader}>
                        <Warning color="error" />
                        <Typography variant="h5">Danger Zone</Typography>
                    </Box>
                    <Typography variant="body1" color="error" paragraph>
                        The following action will delete all your data and reinitialize your database. This cannot be undone.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => {
                            Logger.debug('Purge button clicked');
                            handlePurgeAndReinitialize();
                        }}
                        className={classes.dangerButton}
                    >
                        Purge and Reinitialize Database
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default DangerZone;