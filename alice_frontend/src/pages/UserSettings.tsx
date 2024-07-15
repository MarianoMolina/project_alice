import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, TextField, Typography, Button, Dialog, Card, CardContent, Paper, Grid } from '@mui/material';
import { Person } from '@mui/icons-material';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { User } from '../utils/UserTypes';
import { API } from '../utils/ApiTypes';
import EnhancedAPI from '../components/api/api/EnhancedApi';
import useStyles from '../styles/UserSettingsStyles';

interface UserSettingsProps {
    setHasUnsavedChanges: (value: boolean) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ setHasUnsavedChanges }) => {
    const { fetchItem, updateItem } = useApi();
    const [userObject, setUserObject] = useState<User | null>(null);
    const [originalUserObject, setOriginalUserObject] = useState<User | null>(null);
    const { user } = useAuth();
    const [showCreateAPI, setShowCreateAPI] = useState(false);
    const classes = useStyles();
    const isInitialMount = useRef(true);
    const [apiUpdateTrigger, setApiUpdateTrigger] = useState(0);

    useEffect(() => {
        const loadUser = async () => {
            try {
                if (user) {
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
                const updated = await updateItem('users', userObject._id, userObject);
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

    const handleAPIUpdate = useCallback(async (updatedAPI: API) => {
        if (userObject && userObject._id) {
            try {
                await updateItem('apis', updatedAPI._id!, updatedAPI);
                const updatedUser = await fetchItem('users', userObject._id);
                setUserObject(updatedUser as User);
                setOriginalUserObject(updatedUser as User);
                setApiUpdateTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Error updating API:', error);
            }
        }
    }, [userObject, updateItem, fetchItem]);

    if (!userObject) {
        return <Typography>Loading user settings...</Typography>;
    }

    return (
        <Box className={classes.root}>
            <Typography variant="h4" className={classes.title}>User Settings</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Box className={classes.column}>
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
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box className={classes.column}>
                        <Box className={classes.apiConfigHeader}>
                            <Typography variant="h5">API Configuration</Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setShowCreateAPI(true)}
                            >
                                Create New API
                            </Button>
                        </Box>
                        <Paper className={classes.apiPaper}>
                            <EnhancedAPI
                                key={apiUpdateTrigger}
                                mode="fullList"
                                fetchAll={true}
                                onSave={handleAPIUpdate}
                            />
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
            <Dialog open={showCreateAPI} onClose={() => setShowCreateAPI(false)}>
                <EnhancedAPI
                    mode="create"
                    fetchAll={true}
                    onSave={handleApiCreated}
                />
            </Dialog>
        </Box>
    );
};

export default UserSettings;