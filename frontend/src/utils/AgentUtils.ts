// Base interfaces for common structures
interface BaseDetail {
    title: string;
    description: string;
}

interface Example {
    name: string;
    purpose: string;
    usage?: string;
}

// Subsection types
interface SubsectionBase {
    title: string;
}

interface TemplatingSubsection extends SubsectionBase {
    details: TemplateDetail[];
}

interface SpecialTagsSubsection extends SubsectionBase {
    description: string;
    tags: SpecialTag[];
}

interface ToolPermissionsSubsection extends SubsectionBase {
    description: string;
    levels: PermissionLevel[];
}

interface CodePermissionsSubsection extends SubsectionBase {
    description: string;
    supported_languages: string[];
    levels: PermissionLevel[];
}

interface AutoReplySubsection extends SubsectionBase {
    description: string;
    purpose: string;
}

interface ModelTypesSubsection extends SubsectionBase {
    categories: ModelCategory[];
}

interface UsageNotesSubsection extends SubsectionBase {
    points: string[];
}

interface ModelSettingsSubsection extends SubsectionBase {
    settings: ModelSetting[];
}

// System Prompt Section
interface TemplateDetail extends BaseDetail {
    examples: string[];
}

interface SpecialTag {
    name: string;
    purpose: string;
    usage: string;
}

interface SystemPromptSection {
    title: string;
    description: string;
    subsections: {
        templating: TemplatingSubsection;
        special_tags: SpecialTagsSubsection;
    };
}

// Permissions Section
interface PermissionLevel {
    name: string;
    description: string;
    use_case: string;
    example?: string;
}

interface PermissionsSection {
    title: string;
    description: string;
    subsections: {
        tool_permissions: ToolPermissionsSubsection;
        code_permissions: CodePermissionsSubsection;
        auto_reply: AutoReplySubsection;
    };
}

// Models Section
interface ModelType {
    name: string;
    description?: string;
    usage?: string;
    purpose?: string;
}

interface ModelCategory {
    name: string;
    description?: string;
    types: ModelType[];
}

interface ModelSetting {
    name: string;
    description: string;
}

interface ModelsSection {
    title: string;
    description: string;
    subsections: {
        model_types: ModelTypesSubsection;
        usage_notes: UsageNotesSubsection;
        model_settings: ModelSettingsSubsection;
    };
}

// Section type
export type AgentSectionKey = 'system_prompt' | 'permissions' | 'models';

// Main content interface
interface AgentOverviewContent {
    sections: {
        system_prompt: SystemPromptSection;
        permissions: PermissionsSection;
        models: ModelsSection;
    };
}

export type {
    AgentOverviewContent,
    SystemPromptSection,
    PermissionsSection,
    ModelsSection,
    BaseDetail,
    Example,
    TemplateDetail,
    SpecialTag,
    PermissionLevel,
    ModelType,
    ModelCategory,
    ModelSetting,
    SubsectionBase,
    TemplatingSubsection,
    SpecialTagsSubsection,
    ToolPermissionsSubsection,
    CodePermissionsSubsection,
    AutoReplySubsection,
    ModelTypesSubsection,
    UsageNotesSubsection,
    ModelSettingsSubsection,
};