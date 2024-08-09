import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { Box, TextField, Typography, Button, Dialog, Card, CardContent, Paper, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Person, Api, Warning } from '@mui/icons-material';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/UserTypes';
import { API, getDefaultApiForm } from '../types/ApiTypes';
import { ComponentMode } from '../types/CollectionTypes';
import EnhancedAPI from '../components/enhanced/api/api/EnhancedApi';
import useStyles from '../styles/UserSettingsStyles';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';

interface UserSettingsProps {
    setHasUnsavedChanges: (value: boolean) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ setHasUnsavedChanges }) => {
    const { fetchItem, updateItem, purgeAndReinitializeDatabase } = useApi();
    const [userObject, setUserObject] = useState<User | null>(null);
    const [originalUserObject, setOriginalUserObject] = useState<User | null>(null);
    const { user } = useAuth();
    const [showCreateAPI, setShowCreateAPI] = useState(false);
    const [showConfirmPurge, setShowConfirmPurge] = useState(false);
    const classes = useStyles();
    const isInitialMount = useRef(true);
    const [apiUpdateTrigger, setApiUpdateTrigger] = useState(0);
    const [selectedItem, setSelectedItem] = useState<Partial<API> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('Personal information');

    useEffect(() => {
        const loadUser = async () => {
            try {
                if (user) {
                    console.log('user:', user);
                    const userData = await fetchItem('users', user._id) as User;
                    console.log('User data:', userData);
                    setUserObject(userData);
                    setOriginalUserObject(userData);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
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
                const updated = await updateItem('users', userObject._id ?? '', userObject);
                setUserObject(updated as User);
                setOriginalUserObject(updated as User);
                setHasUnsavedChanges(false);
            } catch (error) {
                console.error('Error updating user:', error);
            }
        }
    }, [userObject, updateItem, setHasUnsavedChanges]);

    const handleApiCreated = useCallback(async (api: API) => {
        setShowCreateAPI(false);
        setApiUpdateTrigger(prev => prev + 1);
    }, []);

    const handleApiSelect = useCallback((item: Partial<API>) => {
        console.log('Item selected:', item);
        setSelectedItem(item);
        setIsCreating(false);
        setShowCreateAPI(true);
    }, []);

    const handlePurgeAndReinitialize = useCallback(async () => {
        try {
            await purgeAndReinitializeDatabase();
            console.log('Database successfully purged and reinitialized');
            // You might want to refresh the user data or perform other actions here
        } catch (error) {
            console.error('Failed to purge and reinitialize database:', error);
            // Handle the error, perhaps show an error message to the user
        } finally {
            setShowConfirmPurge(false);
        }
    }, [purgeAndReinitializeDatabase]);

    const tabs = [
        { name: 'Personal information', icon: Person },
        { name: 'APIs', icon: Api },
    ];

    const renderActiveContent = useCallback(() => {
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
                                    onClick={() => setShowConfirmPurge(true)}
                                    className={classes.dangerButton}
                                >
                                    Purge and Reinitialize Database
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
                );
            case 'APIs':
                return (
                <Box>
                    <Box className={classes.apiConfigHeader}>
                        <Typography variant="h5">API Configuration</Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleApiSelect(getDefaultApiForm())}
                        >
                            Create New API
                        </Button>
                    </Box>
                    <Paper className={classes.apiPaper}>
                        <EnhancedAPI
                            key={apiUpdateTrigger}
                            mode="list"
                            fetchAll={true}
                            onView={handleApiSelect}
                        />
                    </Paper>
                </Box>
                )
            default:
                return null;
        }
    }, [activeTab, userObject, handleUserUpdate, handleSaveChanges, handleApiSelect, apiUpdateTrigger, classes]);

    return (
        <Box className={classes.root}>
            <VerticalMenuSidebar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
                expandedWidth={SIDEBAR_COLLAPSED_WIDTH}
            />
            <Box flexGrow={1} p={3}>
                {renderActiveContent()}
            </Box>
            <Dialog open={showCreateAPI} onClose={() => setShowCreateAPI(false)}>
                <EnhancedAPI
                    itemId={selectedItem?._id}
                    mode={(isCreating ? 'create' : 'edit') as ComponentMode}
                    fetchAll={true}
                    onSave={handleApiCreated}
                />
            </Dialog>
            <Dialog open={showConfirmPurge} onClose={() => setShowConfirmPurge(false)}>
                <DialogTitle>Confirm Database Purge and Reinitialization</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to purge and reinitialize your database? This action cannot be undone and will delete all your current data.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfirmPurge(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handlePurgeAndReinitialize} color="error" variant="contained">
                        Confirm Purge and Reinitialize
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserSettings;