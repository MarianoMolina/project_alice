import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { Box, TextField, Typography, Button, Card, CardContent, Paper } from '@mui/material';
import { Person, Api, Warning, Key } from '@mui/icons-material';
import { useApi } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/UserTypes';
import { useNotification } from '../contexts/NotificationContext';
import { API } from '../types/ApiTypes';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';
import useStyles from '../styles/UserSettingsStyles';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import { useDialog } from '../contexts/DialogCustomContext';
import { useCardDialog } from '../contexts/CardDialogContext';
import Logger from '../utils/Logger';
import { CodeBlock } from '../components/ui/markdown/CodeBlock';

interface UserSettingsProps {
    setHasUnsavedChanges: (value: boolean) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ setHasUnsavedChanges }) => {
    const { openDialog } = useDialog();
    const { selectFlexibleItem } = useCardDialog();
    const { fetchItem, updateItem, purgeAndReinitializeDatabase } = useApi();
    const { addNotification } = useNotification();
    const [userObject, setUserObject] = useState<User | null>(null);
    const [originalUserObject, setOriginalUserObject] = useState<User | null>(null);
    const { user, getToken } = useAuth();
    const classes = useStyles();
    const isInitialMount = useRef(true);
    const [activeTab, setActiveTab] = useState('Personal information');
    const [userToken, setUserToken] = useState<string | null>(null);

    useEffect(() => {
        const token = getToken();
        setUserToken(token);
    }, [getToken]);

    useEffect(() => {
        const loadUser = async () => {
            try {
                if (user) {
                    Logger.debug('Loading user data');
                    const userData = await fetchItem('users', user._id) as User;
                    setUserObject(userData);
                    setOriginalUserObject(userData);
                }
            } catch (error) {
                Logger.error('Error loading user data:', error);
            }
        };
        loadUser();
    }, [user, fetchItem]);

    const checkUnsavedChanges = useCallback(() => {
        if (userObject && originalUserObject) {
            const hasChanges = JSON.stringify(userObject) !== JSON.stringify(originalUserObject);
            setHasUnsavedChanges(hasChanges);
        }
    }, [userObject, originalUserObject, setHasUnsavedChanges]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            setTimeout(() => {
                checkUnsavedChanges();
            }, 0);
        }
    }, [userObject, checkUnsavedChanges]);

    const handleUserUpdate = useCallback((updatedUser: Partial<User>) => {
        setUserObject(prevUser => prevUser ? { ...prevUser, ...updatedUser } : null);
    }, []);

    const handleSaveChanges = useCallback(async () => {
        if (userObject && userObject._id) {
            try {
                Logger.info('Saving user changes');
                const updated = await updateItem('users', userObject._id ?? '', userObject);
                setUserObject(updated as User);
                setOriginalUserObject(updated as User);
                setHasUnsavedChanges(false);
            } catch (error) {
                Logger.error('Error updating user:', error);
            }
        }
    }, [userObject, updateItem, setHasUnsavedChanges]);

    const handleApiSelect = useCallback((item: Partial<API>) => {
        Logger.debug('API selected:', item);
        selectFlexibleItem('API', 'edit', item._id, item as API);
    }, [selectFlexibleItem]);

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
                            // Reload the page immediately after successful purge and reinitialization
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

    const tabs = [
        { name: 'Personal information', icon: Person },
        { name: 'APIs', icon: Api },
        { name: 'User Token', icon: Key },
        { name: 'Danger Zone', icon: Warning },
    ];

    const renderActiveContent = useCallback(() => {
        Logger.debug('Rendering active content:', activeTab);
        if (!userObject) {
            return <Typography>Loading user settings...</Typography>;
        }
        switch (activeTab) {
            case 'Personal information':
                return (
                    <Box>
                        <Card className={classes.card}>
                            <CardContent>
                                <Box className={classes.userInfoHeader}>
                                    <Person />
                                    <Typography variant="h5">Personal Information</Typography>
                                </Box>
                                <TextField
                                    label="Name"
                                    value={userObject.name || ''}
                                    onChange={(e) => handleUserUpdate({ name: e.target.value })}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Email"
                                    value={userObject.email || ''}
                                    onChange={(e) => handleUserUpdate({ email: e.target.value })}
                                    fullWidth
                                    margin="normal"
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSaveChanges}
                                    className={classes.saveButton}
                                >
                                    Save
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                );
            case 'APIs':
                return (
                    <Card className={classes.card}>
                        <CardContent>
                            <Box className={classes.apiConfigHeader}>
                                <Box>
                                    <Api />
                                    <Typography variant="h5">API Configuration</Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => selectFlexibleItem('API', 'create')}
                                >
                                    Create New API
                                </Button>
                            </Box>
                            <Paper className={classes.apiPaper}>
                                <EnhancedAPI
                                    key={0}
                                    mode="list"
                                    fetchAll={true}
                                    onView={handleApiSelect}
                                />
                            </Paper>
                        </CardContent>
                    </Card>
                );
            case 'User Token':
                return (
                    <Card className={classes.card}>
                        <CardContent>
                            <Box className={classes.userInfoHeader}>
                                <Key />
                                <Typography variant="h5">User Token</Typography>
                            </Box>
                            <Typography variant="body1" paragraph>
                                This is your user token. Keep it secret and use it for API authentication.
                            </Typography>
                            {userToken ? (
                                <CodeBlock
                                    language="JWT Token"
                                    code={userToken}
                                />
                            ) : (
                                <Typography variant="body2" color="error">
                                    Token not available. Please try refreshing the page and logging in again.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                );
            case 'Danger Zone':
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
            default:
                return null;
        }
    }, [activeTab, userObject, handleUserUpdate, handleSaveChanges, handleApiSelect, classes, handlePurgeAndReinitialize, selectFlexibleItem, userToken]);

    return (
        <Box className={classes.root}>
            <VerticalMenuSidebar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
                expandedWidth={SIDEBAR_COLLAPSED_WIDTH}
            />
            <Box flexGrow={1} p={3} className={classes.mainContainer}>
                {renderActiveContent()}
            </Box>
        </Box>
    );
};

export default UserSettings;