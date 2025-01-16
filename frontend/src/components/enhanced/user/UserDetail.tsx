import React, { useState } from 'react';
import { defaultUserStats, User, UserRole } from '../../../types/UserTypes';
import { useApi } from '../../../contexts/ApiContext';
import { BasicInfo } from './BasicInfo';
import { UserStats } from './UserStats';
import { UserDetailCard } from './DetailCard';
import ChatConfig from './UserChatConfig';

// Types for field configuration
type AccessLevel = 'all' | 'admin' | 'none';

interface FieldAccess {
    viewAccess: AccessLevel;
    editAccess: AccessLevel;
}

interface FieldConfig {
    basicInfo: {
        name: FieldAccess;
        email: FieldAccess;
        role: FieldAccess;
        userTier: FieldAccess;
    };
    stats: {
        viewAccess: AccessLevel;
        editAccess: AccessLevel;
    };
}

export const FIELD_CONFIG: FieldConfig = {
    basicInfo: {
        name: { viewAccess: 'all', editAccess: 'all' },
        email: { viewAccess: 'all', editAccess: 'admin' },
        role: { viewAccess: 'all', editAccess: 'admin' },
        userTier: { viewAccess: 'all', editAccess: 'admin' }
    },
    stats: {
        viewAccess: 'admin',
        editAccess: 'none'
    }
};

interface UserDetailProps {
    user: User;
    canToggleEdit?: boolean;
    initialEditState?: boolean;
}

const UserDetail: React.FC<UserDetailProps> = ({
    user,
    canToggleEdit = false,
    initialEditState = false,
}) => {
    const [editedUser, setEditedUser] = useState<User>(user);
    const isAdmin = user.role === UserRole.ADMIN;
    const { updateItem } = useApi();

    const handleBasicInfoSave = async (): Promise<void> => {
        const userStats = editedUser.stats || defaultUserStats();
        if (user._id) await updateItem('users', user._id, {
            ...user,
            name: editedUser.name,
            email: editedUser.email,
            role: editedUser.role,
            stats: {
                ...userStats,
                user_tier: editedUser.stats?.user_tier || userStats.user_tier
            }
        });
    };

    const handleChatConfigSave = async (): Promise<void> => {
        if (user._id) await updateItem('users', user._id, {
            ...user,
            default_chat_config: editedUser.default_chat_config
        });
    };

    return (
        <>
            <UserDetailCard
                title="Basic Information"
                canEdit={canToggleEdit}
                initialEditState={initialEditState}
                onSave={handleBasicInfoSave}
            >
                {(isEditing) => (
                    <BasicInfo
                        editedUser={editedUser}
                        isEditing={isEditing}
                        isAdmin={isAdmin}
                        onUserEdit={setEditedUser}
                    />
                )}
            </UserDetailCard>

            {isAdmin && FIELD_CONFIG.stats.viewAccess === 'admin' && (
                <UserDetailCard
                    title="User Stats"
                    canEdit={false}
                >
                    {() => <UserStats user={user} />}
                </UserDetailCard>
            )}

            <UserDetailCard
                title="Chat Configuration"
                canEdit={canToggleEdit}
                initialEditState={initialEditState}
                onSave={handleChatConfigSave}
            >
                {(isEditing) => (
                    <ChatConfig
                        editedUser={editedUser}
                        isEditing={isEditing}
                        onUserEdit={setEditedUser}
                    />
                )}
            </UserDetailCard>
        </>
    );
};

export default UserDetail;