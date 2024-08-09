import React, { createContext, useContext, ReactNode } from 'react';
import { fetchItem, createItem, updateItem, executeTask, generateChatResponse, sendMessage, addTaskResponse, purgeAndReinitializeDatabase } from '../services/api';

interface ApiContextType {
    fetchItem: typeof fetchItem;
    createItem: typeof createItem;
    updateItem: typeof updateItem;
    executeTask: typeof executeTask;
    generateChatResponse: typeof generateChatResponse;
    sendMessage: typeof sendMessage;
    addTaskResponse: typeof addTaskResponse;
    purgeAndReinitializeDatabase: typeof purgeAndReinitializeDatabase;
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
        sendMessage,
        addTaskResponse,
        purgeAndReinitializeDatabase,
    };

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};