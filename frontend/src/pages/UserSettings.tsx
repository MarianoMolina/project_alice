import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { useApi } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/UserTypes';
import useStyles from '../styles/UserSettingsStyles';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import Logger from '../utils/Logger';
import PersonalInformation from '../components/ui/user_settings/PersonalInformation';
import ApiConfigurations from '../components/ui/user_settings/ApiConfigurations';
import UserToken from '../components/ui/user_settings/UserToken';
import DangerZone from '../components/ui/user_settings/DangerZone';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { Api, Key, Person, SvgIconComponent, Warning } from '@mui/icons-material';
import { LMStudioIcon } from '../utils/CustomIcons';
import LMStudioStatus from '../components/ui/user_settings/LMStudioStatus';

interface UserSettingsProps {
    setHasUnsavedChanges: (value: boolean) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ setHasUnsavedChanges }) => {
    const classes = useStyles();
    const { fetchItem } = useApi();
    const { user } = useAuth();
    const [userObject, setUserObject] = useState<User | null>(null);
    const [originalUserObject, setOriginalUserObject] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('Personal information');

    // Use our custom hook to track unsaved changes
    useUnsavedChanges(userObject, originalUserObject, setHasUnsavedChanges);

    const tabs = [
        { name: 'Personal information', icon: Person },
        { name: 'APIs', icon: Api },
        { name: 'User Token', icon: Key },
        { name: 'Danger Zone', icon: Warning },
        { name: 'LM Studio Status', icon: LMStudioIcon as SvgIconComponent},
    ];

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

    const renderActiveContent = () => {
        if (!userObject || !originalUserObject) {
            return null;
        }

        switch (activeTab) {
            case 'Personal information':
                return (
                    <PersonalInformation
                        userObject={userObject}
                        setUserObject={setUserObject}
                    />
                );
            case 'APIs':
                return <ApiConfigurations />;
            case 'User Token':
                return <UserToken />;
            case 'Danger Zone':
                return <DangerZone />;
            case 'LM Studio Status':
                return <LMStudioStatus />;
            default:
                return null;
        }
    };

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