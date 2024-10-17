import React from 'react';
import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import useStyles from '../MessageStyles';
import { MessageComponentProps } from '../../../../types/MessageTypes';
import { BackgroundBeams } from '../../../ui/aceternity/BackgroundBeams';
import { hasAnyReferences } from '../../../../types/ReferenceTypes';
import ReferenceChip from '../../common/references/ReferenceChip';
import { CopyAll, Visibility } from '@mui/icons-material';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import CustomMarkdown from '../../../ui/markdown/CustomMarkdown';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useNotification } from '../../../../contexts/NotificationContext';

const MessageFullView: React.FC<MessageComponentProps> = ({ item: message }) => {
    const classes = useStyles();
    const { selectCardItem, selectFlexibleItem } = useCardDialog();
    const { addNotification } = useNotification();

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
        return (
            <>
                <CustomMarkdown className={classes.markdownText}>{message.content}</CustomMarkdown>
                {message.tool_calls && message.tool_calls.length > 0 && (
                    <>
                        <Typography variant="subtitle2">Tool Calls:</Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {message.tool_calls?.map((toolCall, index) => (
                                <ReferenceChip key={`tool-call-${index}`} reference={toolCall} type="tool_call" view />
                            ))}
                        </Box>
                    </>
                )}
            </>
        );
    };

    const renderReferences = () => {
        if (!message.references || !hasAnyReferences(message.references)) return null;

        return (
            <Box className={classes.referencesContainer}>
                <Typography variant="subtitle2">References:</Typography>

                <Box display="flex" flexWrap="wrap" gap={1}>
                    {message.references.messages?.map((msg, index) => (
                        <ReferenceChip key={`msg-${index}`} reference={msg} type="Message" view />
                    ))}
                    {message.references.files?.map((file, index) => (
                        <ReferenceChip key={`file-${index}`} reference={file} type="File" view />
                    ))}
                    {message.references.task_responses?.map((task, index) => (
                        <ReferenceChip key={`task-${index}`} reference={task} type="TaskResponse" view />
                    ))}
                    {message.references.url_references?.map((url, index) => (
                        <ReferenceChip key={`url-${index}`} reference={url} type="URLReference" view />
                    ))}
                    {message.references.string_outputs?.map((str, index) => (
                        <ReferenceChip key={`str-${index}`} reference={str} type="string_output" view />
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
                    <Box>
                        <Tooltip title="Copy message to clipboard" arrow>
                            <IconButton
                                size='small'
                                onClick={() => addNotification && addNotification('Message copied to clipboard', 'success')}
                                className={classes.viewButton}
                            >
                                <CopyToClipboard text={message.content}>
                                    <CopyAll />
                                </CopyToClipboard>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="View message details" arrow>
                            <IconButton
                                size="small"
                                onClick={() => selectCardItem && selectCardItem('Message', message._id || '', message)}
                                className={classes.viewButton}
                            >
                                <Visibility fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit message" arrow>
                            <IconButton
                                size="small"
                                onClick={() => selectFlexibleItem && selectFlexibleItem('Message', 'edit', message._id, message)}
                                className={classes.editButton}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                    </Box>
                </Box>
                {renderMessageContent()}
                {renderReferences()}
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
        </Box>
    );
};

export default MessageFullView;