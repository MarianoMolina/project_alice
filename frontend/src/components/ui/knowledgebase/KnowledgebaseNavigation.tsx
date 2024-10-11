import React from 'react';
import { List, ListItem, ListItemText, Typography, Divider } from '@mui/material';
import { NavLink } from 'react-router-dom';

const navigation = [
    { title: 'Introduction', path: '/knowledgebase', type: 'main' },
    { title: 'Getting Started', path: '/knowledgebase/getting_started', type: 'main' },
    { title: 'Start chatting', path: '/knowledgebase/start_chat', type: 'main' },
    { title: 'Execute a task', path: '/knowledgebase/execute_task', type: 'main' },
    { title: 'Components', type: 'group' },
    { title: 'Agent', path: '/knowledgebase/agent', type: 'sub' },
    { title: 'API', path: '/knowledgebase/api', type: 'sub' },
    { title: 'Chats', path: '/knowledgebase/chat', type: 'sub' },
    { title: 'Models', path: '/knowledgebase/model', type: 'sub' },
    { title: 'Parameters', path: '/knowledgebase/parameter', type: 'sub' },
    { title: 'Prompts', path: '/knowledgebase/prompt', type: 'sub' },
    { title: 'Tasks', path: '/knowledgebase/task', type: 'sub' },
    { title: 'References', type: 'group' },
    { title: 'Files', path: '/knowledgebase/file', type: 'sub' },
    { title: 'Messages', path: '/knowledgebase/message', type: 'sub' },
    { title: 'URL References', path: '/knowledgebase/url_reference', type: 'sub' },
    { title: 'Task Responses', path: '/knowledgebase/task_response', type: 'sub' },
];

const KnowledgebaseNavigation: React.FC = () => {
    return (
        <List component="nav" sx={{ pt: 2 }}>
            {navigation.map((item, index) => {
                if (item.type === 'group') {
                    return (
                        <React.Fragment key={index}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="overline" sx={{ px: 2, fontWeight: 'bold' }}>
                                {item.title}
                            </Typography>
                        </React.Fragment>
                    );
                }
                return (
                    <ListItem
                        key={index}
                        component={NavLink}
                        to={item.path || ''}
                        sx={{
                            color: 'inherit',
                            textDecoration: 'none',
                            '&.active': {
                                backgroundColor: 'action.selected',
                                '& .MuiListItemText-primary': {
                                    fontWeight: 'bold',
                                },
                            },
                        }}
                    >
                        <ListItemText
                            primary={item.title}
                            primaryTypographyProps={{
                                variant: item.type === 'main' ? 'subtitle1' : 'body2',
                            }}
                        />
                    </ListItem>
                );
            })}
        </List>
    );
};

export default KnowledgebaseNavigation;