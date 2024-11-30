export interface NavItem {
    title: string;
    path?: string;
    type: 'section' | 'title' | 'subtitle';
    items?: NavItem[];
    depth: number;
}

export interface NavSection {
    title: string;
    titleArticle?: {
        title: string;
        path: string;
    };
    items: NavItem[];
    depth: number;
}

export const navigation: NavSection[] = [
    {
        title: 'Introduction',
        depth: 0,
        titleArticle: {
            title: 'Introduction',
            path: '/shared/knowledgebase/'
        },
        items: [
            { title: 'Getting Started', path: '/shared/knowledgebase/general/getting_started', type: 'subtitle', depth: 1 },
            { title: 'Start chatting', path: '/shared/knowledgebase/general/start_chat', type: 'subtitle', depth: 1 },
            { title: 'Execute a task', path: '/shared/knowledgebase/general/execute_task', type: 'subtitle', depth: 1 }
        ]
    },
    {
        title: 'Components',
        depth: 0,
        items: [
            { title: 'Agent', path: '/shared/knowledgebase/core/agent', type: 'subtitle', depth: 1 },
            {
                title: 'API',
                type: 'section',
                depth: 1,
                items: [
                    { title: 'API', path: '/shared/knowledgebase/core/api/api', type: 'title', depth: 2 },
                    { title: 'API Engines', path: '/shared/knowledgebase/core/api/api_engine', type: 'subtitle', depth: 2 },
                ]
            },
            { title: 'Chats', path: '/shared/knowledgebase/core/chat', type: 'subtitle', depth: 1 },
            { title: 'Models', path: '/shared/knowledgebase/core/model', type: 'subtitle', depth: 1 },
            { title: 'Parameters', path: '/shared/knowledgebase/core/parameter', type: 'subtitle', depth: 1 },
            { title: 'Prompts', path: '/shared/knowledgebase/core/prompt', type: 'subtitle', depth: 1 },
            {
                title: 'Tasks',
                type: 'section',
                depth: 1,
                items: [
                    { title: 'Task', path: '/shared/knowledgebase/core/task/task', type: 'title', depth: 2 },
                    { title: 'Workflow', path: '/shared/knowledgebase/core/task/workflow', type: 'subtitle', depth: 2 },
                    { title: 'Prompt Agent Task', path: '/shared/knowledgebase/core/task/prompt_agent_task', type: 'subtitle', depth: 2 },
                    { title: 'Code Generation Task', path: '/shared/knowledgebase/core/task/code_gen_task', type: 'subtitle', depth: 2 },
                    { title: 'Check Task', path: '/shared/knowledgebase/core/task/check_task', type: 'subtitle', depth: 2 },
                    { title: 'Embedding Task', path: '/shared/knowledgebase/core/task/embedding_task', type: 'subtitle', depth: 2 },
                    { title: 'Retrieval Task (RAG)', path: '/shared/knowledgebase/core/task/retrieval_task', type: 'subtitle', depth: 2 },
                    { title: 'Text To Speech Task', path: '/shared/knowledgebase/core/task/text_to_speech_task', type: 'subtitle', depth: 2 },
                    { title: 'Web Scrape Task', path: '/shared/knowledgebase/core/task/web_scrape_task', type: 'subtitle', depth: 2 },
                    { title: 'Image Generation Task', path: '/shared/knowledgebase/core/task/img_gen_task', type: 'subtitle', depth: 2 },
                    { title: 'API Task', path: '/shared/knowledgebase/core/task/api_task', type: 'subtitle', depth: 2 },
                    { title: 'Custom Tasks', path: '/shared/knowledgebase/core/task/custom_task', type: 'subtitle', depth: 2 },
                ]
            }
        ]
    },
    {
        title: 'References',
        depth: 0,
        items: [
            { title: 'Data Cluster', path: '/shared/knowledgebase/core/data_cluster', type: 'title', depth: 1 },
            { title: 'Files', path: '/shared/knowledgebase/core/file', type: 'subtitle', depth: 1 },
            { title: 'Messages', path: '/shared/knowledgebase/core/message', type: 'subtitle', depth: 1 },
            { title: 'Entity References', path: '/shared/knowledgebase/core/entity_reference', type: 'subtitle', depth: 1 },
            { title: 'Task Responses', path: '/shared/knowledgebase/core/task_response', type: 'subtitle', depth: 1 },
            {
                title: 'User Interactions',
                type: 'section',
                depth: 1,
                items: [
                    { title: 'User Interaction', path: '/shared/knowledgebase/core/user_interaction/user_interaction', type: 'title', depth: 2 },
                    { title: 'User Checkpoint', path: '/shared/knowledgebase/core/user_interaction/user_checkpoint', type: 'subtitle', depth: 2 },
                ]
            },
            { title: 'Embeddings', path: '/shared/knowledgebase/core/embedding_chunk', type: 'subtitle', depth: 1 }
        ]
    }
];