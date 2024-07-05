import React, { createContext, useContext, ReactNode } from 'react';
import { fetchItem, createItem, updateItem, executeTask, generateChatResponse, fetchUserChats, fetchChatById, sendMessage } from '../services/api';

interface ApiContextType {
    fetchItem: typeof fetchItem;
    createItem: typeof createItem;
    updateItem: typeof updateItem;
    executeTask: typeof executeTask;
    generateChatResponse: typeof generateChatResponse;
    fetchUserChats: typeof fetchUserChats;
    fetchChatById: typeof fetchChatById;
    sendMessage: typeof sendMessage;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
    const context = useContext(ApiContext);
    if (context === undefined) {
        throw new Error('useApi must be used within an ApiProvider');
    }
    return context;
};

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const value: ApiContextType = {
        fetchItem,
        createItem,
        updateItem,
        executeTask,
        generateChatResponse,
        fetchUserChats,
        fetchChatById,
        sendMessage
    };

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};