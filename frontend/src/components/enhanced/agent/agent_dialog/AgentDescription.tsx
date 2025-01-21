import React, { useState } from 'react';
import {
    IconButton,
    Typography,
    Box,
    Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BentoGrid, BentoGridItem } from '../../../ui/aceternity/BentoGrid';
import { agentDescription } from '../../../../types/AgentTypes';
import { cn } from '../../../../utils/cn';
import { AgentSectionKey, ModelsSection, PermissionsSection, SystemPromptSection, SubsectionBase } from '../../../../utils/AgentUtils';
import SystemPromptSubsectionRenderer from './SystemPromptRenderer';
import PermissionsSubsectionRenderer from './PermissionsRenderer';
import ModelSubsectionRenderer from './ModelRenderer';

const AgentDescription: React.FC = () => {
    const [expandedSections, setExpandedSections] = useState<Set<AgentSectionKey>>(new Set());
    const [currentSection, setCurrentSection] = useState<AgentSectionKey | undefined>();

    const toggleSectionExpansion = (section: AgentSectionKey) => {
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

    const sections = Object.entries(agentDescription.sections) as [AgentSectionKey, SystemPromptSection | PermissionsSection | ModelsSection][];
    const filteredSections = currentSection
        ? sections.filter(([key]) => key === currentSection)
        : sections;

    const itemClass = cn(
        currentSection ? 'md:col-span-4' : 'md:col-span-2'
    );

    return (
        <>                {/* Explanation Section */}
            <Box className="mb-6 space-y-4">
                <Typography variant="body1">
                    Agents are configurable AI assistants that can be customized through their system prompt, permissions, and model configurations.
                </Typography>

                <Alert severity="info" className="mb-4">
                    <Typography variant="body2">
                        <strong>Key Points:</strong>
                        <ul className="list-disc pl-4 mt-2">
                            <li>System prompts define core behavior and can use templating</li>
                            <li>Permission settings control tool usage and code execution</li>
                            <li>Model configurations determine available AI capabilities</li>
                            <li>Click each section for detailed configuration information</li>
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
                                    {isExpanded && (
                                        <Box className="mt-4 space-y-6">
                                            {Object.entries(section.subsections as Record<string, SubsectionBase>).map(([subKey, subsection]) => (
                                                <Box key={subKey} className="space-y-2">
                                                    <Typography variant="subtitle1" className="text-neutral-300 font-medium">
                                                        {subsection.title}
                                                    </Typography>
                                                    {sectionKey === 'system_prompt' && (
                                                        <SystemPromptSubsectionRenderer
                                                            subsectionKey={subKey}
                                                            subsection={subsection as SystemPromptSection['subsections'][keyof SystemPromptSection['subsections']]}
                                                        />
                                                    )}
                                                    {sectionKey === 'permissions' && (
                                                        <PermissionsSubsectionRenderer
                                                            subsectionKey={subKey}
                                                            subsection={subsection as PermissionsSection['subsections'][keyof PermissionsSection['subsections']]}
                                                        />
                                                    )}
                                                    {sectionKey === 'models' && (
                                                        <ModelSubsectionRenderer
                                                            subsectionKey={subKey}
                                                            subsection={subsection as ModelsSection['subsections'][keyof ModelsSection['subsections']]}
                                                        />
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            }
                            className={itemClass}
                            background="bg-slate-900"
                            textColor="text-neutral-200"
                        />
                    )
                })}
            </BentoGrid>
        </>
    );
};

export default AgentDescription;