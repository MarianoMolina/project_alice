import React, { useState } from 'react';
import { Box, Typography, Tooltip, IconButton, Dialog, DialogContent, Chip } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import EditIcon from '@mui/icons-material/Edit';
import useStyles from '../MessageStyles';
import { MessageComponentProps } from '../../../../types/MessageTypes';
import { WorkflowOutput } from '../../task_response/WorkflowOutput';
import { CommandLineLog } from '../../task_response/CommandLog';
import { BackgroundBeams } from '../../../ui/aceternity/BackgroundBeams';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import MessageFlexibleView from './MessageFlexibleView';
import EnhancedMessage from './EnhancedMessage';

const MessageDetailView: React.FC<MessageComponentProps> = ({ item: message, chatId, onChange, handleSave }) => {
    const classes = useStyles();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const { selectItem } = useCardDialog();

    if (!message) {
        return <Typography>No message data available.</Typography>;
    }

    const getCreatorName = () => {
        if (message.type === 'task_result') return 'Task Response';
        if (message.role === 'assistant') return message.assistant_name || "Assistant";
        if (message.role === 'user') {
            if (message.created_by) {
                if (typeof message.created_by === 'string') return "User";
                if (typeof message.created_by === 'object' && 'name' in message.created_by) return message.created_by.name;
            }
            return "User";
        }
    };

    const getMessageClass = () => {
        if (message.generated_by === 'tool') return classes.toolMessage;
        switch (message.role) {
            case 'user':
                return classes.userMessage;
            case 'assistant':
            default:
                return classes.assistantMessage;
        }
    };

    const renderMessageContent = () => {
        if (message.type === 'task_result' && message.task_responses) {
            return <WorkflowOutput content={message.task_responses} />;
        } else if (message.generated_by === 'tool') {
            return <CommandLineLog content={message.content} />;
        } else {
            return <ReactMarkdown className={classes.markdownText}>{message.content}</ReactMarkdown>;
        }
    };

    const renderFileReferences = () => {
        if (!message.references || message.references.length === 0) return null;
        return (
            <Box className={classes.fileReferencesContainer}>
                <Typography variant="subtitle2">Referenced Files:</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                    {message.references.map((reference, index) => (
                        <Chip
                            key={index}
                            label={reference.filename}
                            onClick={() => selectItem('File', reference._id ?? null)}
                            variant="outlined"
                        />
                    ))}
                </Box>
            </Box>
        );
    };

    const renderTaskResponses = () => {
        if (!message.task_responses || message.task_responses.length === 0) return null;
        return (
            <Box className={classes.taskResponsesContainer}>
                <Typography variant="subtitle2">Task Responses:</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                    {message.task_responses.map((taskResponse, index) => (
                        <Chip
                            key={index}
                            label={`Task: ${taskResponse.task_name}`}
                            onClick={() => selectItem('TaskResponse', taskResponse._id ?? '')}
                            variant="outlined"
                        />
                    ))}
                </Box>
            </Box>
        );
    };

    return (
        <Box className={`${classes.message} ${getMessageClass()}`}>
            <BackgroundBeams className="absolute inset-0 w-full h-full" />
            <Box className="relative">
                <Box className={classes.messageHeader}>
                    <Tooltip title="The creator of this message" arrow>
                        <Typography variant="caption" className={classes.assistantName}>
                            {getCreatorName()}
                        </Typography>
                    </Tooltip>
                    {chatId && (
                        <IconButton
                            size="small"
                            onClick={() => setIsEditDialogOpen(true)}
                            className={classes.editButton}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
                {renderMessageContent()}
                {renderFileReferences()}
                {renderTaskResponses()}
                <Box className={classes.metadataContainer}>
                    {message.step && (
                        <Tooltip title="Task or source that produced this message" arrow>
                            <Typography variant="caption" className={classes.metadata}>
                                Step: {message.step}
                            </Typography>
                        </Tooltip>
                    )}
                    {message.context && Object.keys(message.context).length > 0 && (
                        <Tooltip title="Context relevant to the creation of this message" arrow>
                            <Typography variant="caption" className={classes.metadata}>
                                Context: {JSON.stringify(message.context)}
                            </Typography>
                        </Tooltip>
                    )}
                </Box>
            </Box>
            <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogContent>
                    <EnhancedMessage
                        itemId={message._id}
                        mode={'edit'}
                        onSave={async () => {
                            await handleSave();
                            setIsEditDialogOpen(false);
                        }}
                        chatId={chatId}
                        fetchAll={false}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default MessageDetailView;