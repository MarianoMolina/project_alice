import React, { useState } from 'react';
import {
    IconButton,
    Typography,
    Box,
    Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BentoGrid, BentoGridItem } from '../../../ui/aceternity/BentoGrid';
import { cn } from '../../../../utils/cn';
import AgentDescription from '../../agent/agent_dialog/AgentDescription';
import TaskCapabilities from '../../task/task_dialog/TaskTypeDescription';
import ChatOverviewSection from './ChatOverview';
import ChatThreadsSection from './ChatThreadsOverview';

type ChatSectionKey = 'overview' | 'threads' | 'agent_config' | 'tools';

interface ChatSection {
    title: string;
    description: string;
    component?: React.ReactNode;
}

const chatSections: Record<ChatSectionKey, ChatSection> = {
    overview: {
        title: 'Chat Overview',
        description: 'A chat represents an interactive environment where an AI agent can engage in multiple conversation threads while maintaining consistent configuration and capabilities across all interactions.',
        component: <ChatOverviewSection />
    },
    threads: {
        title: 'Message Threads',
        description: 'Chats can contain multiple conversation threads, each maintaining its own context and history while sharing the same agent configuration and tools. This allows for organized parallel discussions or different aspects of a task.',
        component: <ChatThreadsSection />
    },
    agent_config: {
        title: 'Agent Configuration',
        description: 'Each chat is powered by a dedicated AI agent with specific model settings, system prompts, and permission configurations that define its capabilities and behavior.',
        component: <AgentDescription />
    },
    tools: {
        title: 'Available Tools',
        description: 'Chats can be equipped with both standard agent tools for various operations and specialized retrieval tools that leverage connected data clusters for enhanced context and capabilities.',
        component: <TaskCapabilities />
    }
};

const ChatDescription: React.FC = () => {
    const [expandedSections, setExpandedSections] = useState<Set<ChatSectionKey>>(new Set());
    const [currentSection, setCurrentSection] = useState<ChatSectionKey | undefined>();

    const toggleSectionExpansion = (section: ChatSectionKey) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
            setCurrentSection(undefined);
        } else {
            newExpanded.add(section);
            setCurrentSection(section);
        }
        setExpandedSections(newExpanded);
    };

    const sections = Object.entries(chatSections) as [ChatSectionKey, ChatSection][];
    const filteredSections = currentSection
        ? sections.filter(([key]) => key === currentSection)
        : sections;

    const itemClass = cn(
        currentSection ? 'md:col-span-4' : 'md:col-span-2'
    );

    return (
        <>
            {/* Explanation Section */}
            <Box className="mb-6 space-y-4">
                <Typography variant="body1">
                    Chats provide flexible environments for AI interactions, combining dedicated agents, multiple conversation threads, and specialized tools.
                </Typography>

                <Alert severity="info" className="mb-4">
                    <Typography variant="body2">
                        <strong>Key Points:</strong>
                        <ul className="list-disc pl-4 mt-2">
                            <li>Support multiple conversation threads with shared context</li>
                            <li>Powered by configurable AI agents with specific capabilities</li>
                            <li>Access to both standard and data-driven retrieval tools</li>
                            <li>Maintain consistent behavior through agent configurations</li>
                        </ul>
                    </Typography>
                </Alert>
            </Box>

            {/* Section Grid */}
            <BentoGrid className="w-full">
                {filteredSections.map(([sectionKey, section]) => {
                    const isExpanded = expandedSections.has(sectionKey);

                    return (
                        <BentoGridItem
                            key={sectionKey}
                            title={section.title}
                            header={
                                <Box className="flex items-center gap-2">
                                    <Typography variant="subtitle2" className="text-neutral-200">
                                        {currentSection === sectionKey ? 'Less details' : 'More details'}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => toggleSectionExpansion(sectionKey)}
                                        className="text-neutral-200 hover:text-white"
                                    >
                                        <ExpandMoreIcon
                                            className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </IconButton>
                                </Box>
                            }
                            description={
                                <Box className="space-y-4">
                                    <Typography variant="body1" className="text-neutral-200">
                                        {section.description}
                                    </Typography>
                                    {isExpanded && section.component && (
                                        <Box className="mt-4">
                                            {section.component}
                                        </Box>
                                    )}
                                </Box>
                            }
                            className={itemClass}
                            background="bg-slate-900"
                            textColor="text-neutral-200"
                        />
                    );
                })}
            </BentoGrid>
        </>
    );
};

export default ChatDescription;