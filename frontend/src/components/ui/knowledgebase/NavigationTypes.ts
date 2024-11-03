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
            path: '/knowledgebase'
        },
        items: [
            { title: 'Getting Started', path: '/knowledgebase/general/getting_started', type: 'subtitle', depth: 1 },
            { title: 'Start chatting', path: '/knowledgebase/general/start_chat', type: 'subtitle', depth: 1 },
            { title: 'Execute a task', path: '/knowledgebase/general/execute_task', type: 'subtitle', depth: 1 }
        ]
    },
    {
        title: 'Components',
        depth: 0,
        items: [
            { title: 'Agent', path: '/knowledgebase/core/agent', type: 'subtitle', depth: 1 },
            {
                title: 'API',
                type: 'section',
                depth: 1,
                items: [
                    { title: 'API', path: '/knowledgebase/core/api/api', type: 'title', depth: 2 },
                    { title: 'API Engines', path: '/knowledgebase/core/api/api_engine', type: 'subtitle', depth: 2 },
                ]
            },
            { title: 'Chats', path: '/knowledgebase/core/chat', type: 'subtitle', depth: 1 },
            { title: 'Models', path: '/knowledgebase/core/model', type: 'subtitle', depth: 1 },
            { title: 'Parameters', path: '/knowledgebase/core/parameter', type: 'subtitle', depth: 1 },
            { title: 'Prompts', path: '/knowledgebase/core/prompt', type: 'subtitle', depth: 1 },
            {
                title: 'Tasks',
                type: 'section',
                depth: 1,
                items: [
                    { title: 'Task', path: '/knowledgebase/core/task/task', type: 'title', depth: 2 },
                    { title: 'Custom Tasks', path: '/knowledgebase/core/task/custom_task', type: 'subtitle', depth: 2 },
                    { title: 'Prompt Agent Task', path: '/knowledgebase/core/task/prompt_agent_task', type: 'subtitle', depth: 2 },
                    { title: 'Workflow', path: '/knowledgebase/core/task/workflow', type: 'subtitle', depth: 2 },
                    { title: 'API Task', path: '/knowledgebase/core/task/api_task', type: 'subtitle', depth: 2 },
                    { title: 'Embedding Task', path: '/knowledgebase/core/task/embedding_task', type: 'subtitle', depth: 2 },
                    { title: 'Retrieval Task (RAG)', path: '/knowledgebase/core/task/retrieval_task', type: 'subtitle', depth: 2 },
                ]
            }
        ]
    },
    {
        title: 'References',
        depth: 0,
        items: [
            { title: 'Data Cluster', path: '/knowledgebase/core/data_cluster', type: 'title', depth: 1 },
            { title: 'Files', path: '/knowledgebase/core/file', type: 'subtitle', depth: 1 },
            { title: 'Messages', path: '/knowledgebase/core/message', type: 'subtitle', depth: 1 },
            { title: 'URL References', path: '/knowledgebase/core/url_reference', type: 'subtitle', depth: 1 },
            { title: 'Task Responses', path: '/knowledgebase/core/task_response', type: 'subtitle', depth: 1 },
            {
                title: 'User Interactions',
                type: 'section',
                depth: 1,
                items: [
                    { title: 'User Interaction', path: '/knowledgebase/core/user_interaction/user_interaction', type: 'title', depth: 2 },
                    { title: 'User Checkpoint', path: '/knowledgebase/core/user_interaction/user_checkpoint', type: 'subtitle', depth: 2 },
                ]
            },
            { title: 'Embeddings', path: '/knowledgebase/core/embedding_chunk', type: 'subtitle', depth: 1 }
        ]
    }
];