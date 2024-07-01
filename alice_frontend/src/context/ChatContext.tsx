import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MessageType, AliceChat, AliceAgent, CreateAliceChat, AliceTask, TaskResponse } from '../utils/types';
import { fetchUserChats, fetchChatById, sendMessage, generateChatResponse, createItem, updateItem, fetchItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ChatContextType {
    messages: MessageType[];
    setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
    newMessage: string;
    setNewMessage: React.Dispatch<React.SetStateAction<string>>;
    pastChats: AliceChat[];
    setPastChats: React.Dispatch<React.SetStateAction<AliceChat[]>>;
    currentChatId: string | null;
    setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
    agents: AliceAgent[];
    setAgents: React.Dispatch<React.SetStateAction<AliceAgent[]>>;
    isGenerating: boolean;
    setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
    handleSelectChat: (chatId: string) => Promise<void>;
    handleSendMessage: (messageContent: string) => Promise<void>;
    generateResponse: () => Promise<void>;
    handleRegenerateResponse: () => Promise<void>;
    fetchChats: () => Promise<void>;
    createNewChat: (chatData: Partial<CreateAliceChat>) => Promise<string>;
    currentChat: AliceChat | null;
    addTasksToChat: (taskIds: string[]) => Promise<void>;
    addTaskResultsToChat: (taskResultIds: string[]) => Promise<void>;
    isTaskInChat: (taskId: string) => boolean;
    isTaskResultInChat: (taskResultId: string) => boolean;
    fetchAvailableTasks: () => Promise<AliceTask[]>;
    fetchAvailableTaskResults: () => Promise<TaskResponse[]>;
}

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [pastChats, setPastChats] = useState<AliceChat[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [agents, setAgents] = useState<AliceAgent[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [currentChat, setCurrentChat] = useState<AliceChat | null>(null);
    const { user } = useAuth();

    const fetchChats = async () => {
        try {
            const chats = await fetchUserChats();
            setPastChats(chats);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user]);

    const handleSelectChat = async (chatId: string) => {
        try {
            const chatData = await fetchChatById(chatId);
            setCurrentChat(chatData);
            setMessages(chatData.messages);
            setCurrentChatId(chatId);
            setAgents([chatData.alice_agent]);
        } catch (error) {
            console.error('Error fetching chat:', error);
        }
    };

    const createNewChat = async (chatData: Partial<CreateAliceChat>): Promise<string> => {
        try {
            const newChat = await createItem("chats", chatData);
            await fetchChats(); // Re-fetch all chats
            handleSelectChat(newChat._id); // Set the new chat as active
            return newChat._id;
        } catch (error) {
            console.error('Error creating new chat:', error);
            throw error;
        }
    };

    const handleSendMessage = async (messageContent: string) => {
        if (!currentChatId) {
            throw new Error('No chat selected');
        }
        try {
            const message: MessageType = {
                role: 'user',
                content: messageContent,
                generated_by: 'user',
                type: 'text',
            };
            await sendMessage(currentChatId, message);
            setMessages(prevMessages => [...prevMessages, message]);
            await generateResponse();
        } catch (error) {
            console.error('Error sending message or generating response:', error);
        }
    };

    const generateResponse = async () => {
        if (!currentChatId) return;
        setIsGenerating(true);
        try {
            const response = await generateChatResponse(currentChatId);
            setMessages(prevMessages => [...prevMessages, ...response]);
        } catch (error) {
            console.error('Error generating response:', error);
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
            await updateItem("chats", currentChatId, { messages: newMessages });
            setMessages(newMessages);
            await generateResponse();
        } catch (error) {
            console.error('Error regenerating response:', error);
        }
    };

    const addTasksToChat = async (taskIds: string[]) => {
        if (!currentChatId || !currentChat) return;
        try {
            const tasks = await Promise.all(taskIds.map(id => fetchItem("tasks", id)));
            const updatedFunctions = [...(currentChat.functions || []), ...tasks];
            await updateItem("chats", currentChatId, { functions: updatedFunctions });
            await handleSelectChat(currentChatId); // Re-fetch chat data
        } catch (error) {
            console.error('Error adding tasks to chat:', error);
        }
    };

    const addTaskResultsToChat = async (taskResultIds: string[]) => {
        if (!currentChatId || !currentChat) return console.log('No chat selected');
        try {
            const taskResults = await Promise.all(taskResultIds.map(id => fetchItem("taskresults", id)));
            console.log('Task results:', taskResults)
            const updatedTaskResponses = [...(currentChat.task_responses || []), ...taskResults];
            const newMessages: MessageType[] = taskResults.map(result => ({
                role: 'assistant',
                content: JSON.stringify(result.task_outputs),
                generated_by: 'tool',
                type: 'TaskResponse',
                step: result.task_name,
            }));
            const updatedMessages = [...messages, ...newMessages];
            console.log('Adding task results to chat:', updatedTaskResponses, updatedMessages)
            await updateItem("chats", currentChatId, { 
                task_responses: updatedTaskResponses,
                messages: updatedMessages
            });
            await handleSelectChat(currentChatId); // Re-fetch chat data
        } catch (error) {
            console.error('Error adding task results to chat:', error);
        }
    };

    const isTaskInChat = (taskId: string): boolean => {
        return currentChat?.functions?.some(task => task._id === taskId) || false;
    };

    const isTaskResultInChat = (taskResultId: string): boolean => {
        return currentChat?.task_responses?.some(result => result._id === taskResultId) || false;
    };

    const fetchAvailableTasks = async (): Promise<AliceTask[]> => {
        try {
            return await fetchItem("tasks");
        } catch (error) {
            console.error('Error fetching available tasks:', error);
            return [];
        }
    };

    const fetchAvailableTaskResults = async (): Promise<TaskResponse[]> => {
        try {
            return await fetchItem("taskresults");
        } catch (error) {
            console.error('Error fetching available task results:', error);
            return [];
        }
    };

    const value: ChatContextType = {
        messages,
        setMessages,
        newMessage,
        setNewMessage,
        pastChats,
        setPastChats,
        currentChatId,
        setCurrentChatId,
        agents,
        setAgents,
        isGenerating,
        setIsGenerating,
        handleSelectChat,
        handleSendMessage,
        generateResponse,
        handleRegenerateResponse,
        fetchChats,
        createNewChat,
        currentChat,
        addTasksToChat,
        addTaskResultsToChat,
        isTaskInChat,
        isTaskResultInChat,
        fetchAvailableTasks,
        fetchAvailableTaskResults,
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