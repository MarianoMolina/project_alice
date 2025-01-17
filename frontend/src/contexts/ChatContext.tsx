import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { AliceTask, PopulatedTask } from '../types/TaskTypes';
import { AliceChat, PopulatedAliceChat } from '../types/ChatTypes';
import { PopulatedMessage } from '../types/MessageTypes';
import { useAuth } from './AuthContext';
import { useApi } from './ApiContext';
import Logger from '../utils/Logger';
import { globalEventEmitter } from '../utils/EventEmitter';
import { fetchPopulatedItem } from '../services/api';
import { PopulatedChatThread } from '../types/ChatThreadTypes';

interface ChatContextType {
    messages: PopulatedMessage[];
    setMessages: React.Dispatch<React.SetStateAction<PopulatedMessage[]>>;
    setCurrentThread: React.Dispatch<React.SetStateAction<PopulatedChatThread | null>>;
    currentThread: PopulatedChatThread | null;
    threads: PopulatedChatThread[];
    setThreads: React.Dispatch<React.SetStateAction<PopulatedChatThread[]>>;
    pastChats: AliceChat[];
    setPastChats: React.Dispatch<React.SetStateAction<AliceChat[]>>;
    currentChatId: string | null;
    setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
    isGenerating: boolean;
    setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
    handleSelectThread: (threadId: string) => Promise<void>;
    handleSelectChat: (chatId: string) => Promise<void>;
    handleSendMessage: (currentChatId: string, threadId:string, message: PopulatedMessage) => Promise<void>;
    generateResponse: () => Promise<void>;
    handleRegenerateResponse: () => Promise<void>;
    fetchChats: () => Promise<void>;
    currentChat: PopulatedAliceChat | null;
    addTaskToChat: (taskId: string) => Promise<void>;
    isTaskInChat: (taskId: string) => boolean;
    lastMessageRole: string | undefined;
    chatContextCharacterCount: number;
    maxContext: number;
}

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const { fetchItem, updateItem, sendMessage, generateChatResponse } = useApi();
    const [messages, setMessages] = useState<PopulatedMessage[]>([]);
    const [threads, setThreads] = useState<PopulatedChatThread[]>([]);
    const [currentThread, setCurrentThread] = useState<PopulatedChatThread | null>(null);
    const [pastChats, setPastChats] = useState<AliceChat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [currentChat, setCurrentChat] = useState<PopulatedAliceChat | null>(null);
    const { user } = useAuth();

    const fetchChats = useCallback(async () => {
        try {
            const chats = await fetchItem('chats') as AliceChat[];
            setPastChats(chats);
        } catch (error) {
            Logger.error('Error fetching chats:', error);
        }
    }, [fetchItem]);

    const chatMessageCharacterCount = useMemo(() => {
        let size = 0;
        messages.forEach((message) => {
            size += message.content.length;
        });
        return size
    }, [messages])

    const lastMessageRole = useMemo(() => {
        return messages.length > 0 ? messages[messages.length - 1].role : undefined
    }, [messages])

    const chatContextCharacterCount = useMemo(() => {
        if (!currentChat?.alice_agent) return chatMessageCharacterCount;
        const sysPropmtSize = currentChat?.alice_agent?.system_message?.content?.length || 0;
        const size = chatMessageCharacterCount + sysPropmtSize;
        return size
    }, [chatMessageCharacterCount, currentChat?.alice_agent])

    const maxContext = useMemo(() => {
        return currentChat?.alice_agent.models?.chat?.config_obj?.ctx_size || currentChat?.alice_agent.models?.instruct?.config_obj?.ctx_size || 0
    }, [currentChat?.alice_agent])

    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user, fetchChats]);

    const fetchChatById = useCallback(async (chatId: string): Promise<PopulatedAliceChat> => {
        try {
            const chatData = await fetchPopulatedItem('chats', chatId) as PopulatedAliceChat;
            // TODO: Update past chats with the updated object
            Logger.debug('Fetched chat by id:', chatData);
            return chatData;
        } catch (error) {
            Logger.error('Error fetching chat by id:', error);
            throw error;
        }
    }, []);

    const handleSelectChat = useCallback(async (chatId: string) => {
        try {
            const chatData = await fetchChatById(chatId);
            Logger.info('Selected chat:', chatId, chatData);
            resetChat(true);
            setCurrentChat(chatData);
            setCurrentChatId(chatId);
            setThreads(chatData.threads || []);
        } catch (error) {
            Logger.error('Error fetching chat:', error);
        }
    }, [fetchChatById]);

    const resetChat = (resetThread: boolean = false, resetChat: boolean = false) => {
        setMessages([]);
        setIsGenerating(false);
        if (resetThread) {
            setCurrentThread(null);
        }
        if (resetChat) {
            setCurrentChat(null);
            setCurrentChatId(null);
            setThreads([]);
        }
    }

    const handleSelectThread = async (threadId: string) => {
        try {
            const thread = await fetchPopulatedItem('chatthreads', threadId) as PopulatedChatThread;
            const updatedChat = { ...currentChat!, threads: currentChat?.threads?.map(t => t._id === threadId ? thread : t) };
            resetChat();
            setMessages(thread.messages);
            setCurrentChat(updatedChat)
            setCurrentThread(thread);
        } catch (error) {
            Logger.error('Error fetching thread:', error);
        }
    }

    const fetchCurrentChat = useCallback(async () => {
        if (!currentChatId) return;
        return handleSelectChat(currentChatId);
    }, [currentChatId, handleSelectChat]);

    const fetchCurrentThread = useCallback(async () => {
        if (!currentThread?._id) return;
        return handleSelectThread(currentThread._id);
    }, [currentThread, handleSelectThread]);
    
    useEffect(() => {
        globalEventEmitter.on('created:chats', fetchChats);
        globalEventEmitter.on('updated:chats', fetchCurrentChat);

        return () => {
            globalEventEmitter.off('created:chats', fetchChats);
            globalEventEmitter.off('updated:chats', fetchCurrentChat);
        };
    }, [currentChatId, fetchChats, fetchCurrentChat]);

    const handleSendMessage = async (currentChatId: string, threadId: string, message: PopulatedMessage) => {
        try {
            Logger.debug('Sending message:', message);
            setMessages(prevMessages => [...prevMessages, message]);
            const updatedChatThread = await sendMessage(currentChatId, threadId, message);
            setMessages(updatedChatThread.messages);
            setCurrentThread(updatedChatThread);
            // TODO: Update threads with the updated thread
            await generateResponse();
        } catch (error) {
            Logger.error('Error sending message or generating response:', error);
        }
    };

    const generateResponse = async () => {
        if (!currentChatId || !currentThread || !currentThread._id) return;
        setIsGenerating(true);
        try {
            // TODO: WORKFLOW SHOULD BE RETURNING A POPULATED MESSAGE, but its currently returning a non populated version
            // so we need to retrieve the entire thread again
            const response = await generateChatResponse(currentChatId, currentThread._id);
            if (response) {
                await fetchCurrentThread();
            }
        } catch (error) {
            Logger.error('Error generating response:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateResponse = async () => {
        if (!currentChatId) return;
        let newMessages = [...messages];
        while (newMessages.length > 0 && newMessages[newMessages.length - 1].role !== 'user') {
            newMessages.pop();
        }
        try {
            await updateItem("chatthreads", currentThread?._id!, { messages: newMessages });
            setMessages(newMessages);
            await generateResponse();
        } catch (error) {
            Logger.error('Error regenerating response:', error);
        }
    };
    const isTaskInChat = (taskId: string): boolean => {
        return currentChat?.agent_tools?.some(task => task._id === taskId) || false;
    };

    const addTaskToChat = async (taskId: string) => {
        if (!currentChatId || !currentChat) return;
        try {
            const task = await fetchItem("tasks", taskId) as AliceTask;
            if (!task) return Logger.error('Task not found', taskId);
            if (isTaskInChat(taskId)) return Logger.warn('Task already in chat');
            const updatedFunctions = [
                ...(currentChat.agent_tools || []), task
            ];
            await updateItem("chats", currentChatId, { agent_tools: updatedFunctions as PopulatedTask[] });
            await handleSelectChat(currentChatId);
        } catch (error) {
            Logger.error('Error adding tasks to chat:', error);
        }
    };

    const value: ChatContextType = {
        messages,
        setMessages,
        threads,
        setThreads,
        currentThread,
        setCurrentThread,
        pastChats,
        setPastChats,
        currentChatId,
        setCurrentChatId,
        isGenerating,
        setIsGenerating,
        handleSelectChat,
        handleSendMessage,
        handleSelectThread,
        generateResponse,
        handleRegenerateResponse,
        fetchChats,
        currentChat,
        addTaskToChat,
        isTaskInChat,
        chatContextCharacterCount,
        lastMessageRole,
        maxContext,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (context === null) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};