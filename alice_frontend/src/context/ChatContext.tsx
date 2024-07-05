import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TaskResponse } from '../utils/TaskResponseTypes';
import { AliceAgent } from '../utils/AgentTypes';
import { AliceTask } from '../utils/TaskTypes';
import { MessageType, AliceChat } from '../utils/ChatTypes';
import { useAuth } from '../context/AuthContext';
import { useApi } from './ApiContext';

interface ChatContextType {
    messages: MessageType[];
    setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
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
    const { fetchItem, updateItem, fetchUserChats, fetchChatById, sendMessage, generateChatResponse } = useApi();
    const [messages, setMessages] = useState<MessageType[]>([]);
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
          console.log('Fetching chat with id:', chatId);
          const chatData = await fetchChatById(chatId);
          console.log('Fetched chat data:', chatData);
          setCurrentChat(chatData);
          setMessages(chatData.messages);
          setCurrentChatId(chatId);
          setAgents([chatData.alice_agent]);
        } catch (error) {
          console.error('Error fetching chat:', error);
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
    const isTaskInChat = (taskId: string): boolean => {
        return currentChat?.functions?.some(task => task._id === taskId) || false;
    };

    const isTaskResultInChat = (taskResultId: string): boolean => {
        return currentChat?.task_responses?.some(result => result._id === taskResultId) || false;
    };
    const addTasksToChat = async (taskIds: string[]) => {
        if (!currentChatId || !currentChat) return;
        try {
            const tasks = await Promise.all(taskIds.map(id => fetchItem("tasks", id)));
            const updatedFunctions = [
                ...(currentChat.functions || []),
                ...tasks.flatMap(task => Array.isArray(task) ? task : [task])
            ];
            await updateItem("chats", currentChatId, { functions: updatedFunctions });
            await handleSelectChat(currentChatId);
        } catch (error) {
            console.error('Error adding tasks to chat:', error);
        }
    };

    const addTaskResultsToChat = async (taskResultIds: string[]) => {
        if (!currentChatId || !currentChat) return console.log('No chat selected');
        try {
            const taskResults = await Promise.all(taskResultIds.map(id => fetchItem("taskresults", id)));
            console.log('Task results:', taskResults);
            const updatedTaskResponses = [
                ...(currentChat.task_responses || []),
                ...taskResults.flatMap(result => Array.isArray(result) ? result : [result])
            ];
            const newMessages: MessageType[] = taskResults.flatMap(result => {
                if (Array.isArray(result)) {
                    return result.map(r => ({
                        role: 'assistant',
                        content: JSON.stringify(r.task_outputs),
                        generated_by: 'tool',
                        type: 'TaskResponse',
                        step: r.task_name,
                    }));
                } else {
                    return [{
                        role: 'assistant',
                        content: JSON.stringify(result.task_outputs),
                        generated_by: 'tool',
                        type: 'TaskResponse',
                        step: result.task_name,
                    }];
                }
            });
            const updatedMessages = [...messages, ...newMessages];
            console.log('Adding task results to chat:', updatedTaskResponses, updatedMessages);
            await updateItem("chats", currentChatId, { 
                task_responses: updatedTaskResponses,
                messages: updatedMessages
            });
            await handleSelectChat(currentChatId);
        } catch (error) {
            console.error('Error adding task results to chat:', error);
        }
    };

    const fetchAvailableTasks = async (): Promise<AliceTask[]> => {
        try {
            const tasks = await fetchItem("tasks") as AliceTask | AliceTask[];
            return Array.isArray(tasks) ? tasks : [tasks];
        } catch (error) {
            console.error('Error fetching available tasks:', error);
            return [];
        }
    };

    const fetchAvailableTaskResults = async (): Promise<TaskResponse[]> => {
        try {
            const taskResults = await fetchItem("taskresults") as TaskResponse | TaskResponse[];
            return Array.isArray(taskResults) ? taskResults : [taskResults];
        } catch (error) {
            console.error('Error fetching available task results:', error);
            return [];
        }
    };

    const value: ChatContextType = {
        messages,
        setMessages,
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