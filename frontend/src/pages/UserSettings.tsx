import React, { useState, useEffect } from 'react';
import { Api, Factory, Key, Person, SvgIconComponent, Warning, AdminPanelSettings } from '@mui/icons-material';
import { Box } from '@mui/material';
import { SIDEBAR_COLLAPSED_WIDTH } from '../utils/Constants';
import { User } from '../types/UserTypes';
import { LMStudioIcon } from '../utils/CustomIcons';
import VerticalMenuSidebar from '../components/ui/vertical_menu/VerticalMenuSidebar';
import ApiConfigurations from '../components/ui/user_settings/ApiConfigurations';
import UserToken from '../components/ui/user_settings/UserToken';
import DangerZone from '../components/ui/user_settings/DangerZone';
import LMStudioStatus from '../components/ui/user_settings/LMStudioStatus';
import {AdminTools} from '../components/ui/user_settings/AdminTools/AdminTools';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useApi } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';
import useStyles from '../styles/UserSettingsStyles';
import Logger from '../utils/Logger';
import WorkflowHealthStatus from '../components/ui/user_settings/WorkflowStatus';
import UserDetail from '../components/enhanced/user/UserDetail';

interface UserSettingsProps {
    setHasUnsavedChanges: (value: boolean) => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ setHasUnsavedChanges }) => {
    const classes = useStyles();
    const { fetchItem } = useApi();
    const { user, isAdmin } = useAuth();
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
        { name: 'Workflow Module Status', icon: Factory },
        ...(isAdmin ? [{ name: 'Admin Tools', icon: AdminPanelSettings }] : []),
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
                    // <PersonalInformation
                    //     userObject={userObject}
                    //     setUserObject={setUserObject}
                    // />
                    <UserDetail
                        user={userObject}
                        initialEditState={false}
                        canToggleEdit={true}
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
            case 'Workflow Module Status':
                return <WorkflowHealthStatus />;
            case 'Admin Tools':
                return isAdmin ? <AdminTools /> : null;
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