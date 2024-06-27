import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MessageType, AliceChat, AliceAgent, CreateAliceChat } from '../utils/types';
import { fetchUserChats, fetchChatById, sendMessage, generateChatResponse, createItem, updateItem } from '../services/api';
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
    handleSelectChat: (chatid: string) => Promise<void>;
    handleSendMessage: (messageContent: string) => Promise<void>;
    generateResponse: () => Promise<void>;
    handleRegenerateResponse: () => Promise<void>;
    fetchChats: () => Promise<void>;
    createNewChat: (chatData: Partial<CreateAliceChat>) => Promise<string>;
    currentChat: AliceChat | null;
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

    // const handleSelectAgent = async (agentId: string | null): Promise<AliceAgent> => {
    //     if (agentId) {
    //         return await fetchItem("agents", agentId);
    //     } else {
    //         return handleSelectAgent('667899a632793b02d478efdd');
    //     }
    // };

    // const handleSelectExecutorAgent = async (agentId: string | null): Promise<AliceAgent> => {
    //     if (agentId) {
    //         return await fetchItem("agents", agentId);
    //     } else {
    //         return handleSelectExecutorAgent('6678997432793b02d478efdb');
    //     }
    // };

    const handleSelectChat = async (chat_id: string) => {
        try {
            const chatData = await fetchChatById(chat_id);
            setCurrentChat(chatData);
            setMessages(chatData.messages);
            setCurrentChatId(chat_id);
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
            return newChat;
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
                created_by: 'user',
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
        currentChat
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