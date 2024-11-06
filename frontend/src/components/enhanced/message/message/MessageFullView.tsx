import React from 'react';
import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import useStyles from '../MessageStyles';
import { MessageComponentProps, MessageGenerators, RoleType } from '../../../../types/MessageTypes';
import { BackgroundBeams } from '../../../ui/aceternity/BackgroundBeams';
import ReferenceChip from '../../common/references/ReferenceChip';
import { CopyAll, Visibility } from '@mui/icons-material';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useNotification } from '../../../../contexts/NotificationContext';
import AliceMarkdown, { CustomBlockType } from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import DataClusterManager from '../../data_cluster/data_cluster_manager/DataClusterManager';
import { hasAnyReferences } from '../../../../types/ReferenceTypes';

const MessageFullView: React.FC<MessageComponentProps> = ({ item: message }) => {
    const classes = useStyles();
    const { selectCardItem, selectFlexibleItem } = useCardDialog();
    const { addNotification } = useNotification();

    if (!message) {
        return <Typography>No message data available.</Typography>;
    }

    const getCreatorName = () => {
        if (message.type === 'task_result') return 'Task Response';
        if (message.role === RoleType.ASSISTANT) return message.assistant_name || "Assistant";
        if (message.role === RoleType.USER) {
            if (message.created_by) {
                if (typeof message.created_by === 'string') return "User";
                if (typeof message.created_by === 'object' && 'name' in message.created_by) return message.created_by.name;
            }
            return "User";
        }
    };

    const getMessageClass = () => {
        if (message.generated_by === MessageGenerators.TOOL) return classes.toolMessage;
        switch (message.role) {
            case RoleType.USER:
                return classes.userMessage;
            case RoleType.ASSISTANT:
            default:
                return classes.assistantMessage;
        }
    };

    const renderMessageContent = () => {
        return (
            <>
                <AliceMarkdown role={message.role} enabledBlocks={[CustomBlockType.ALICE_DOCUMENT, CustomBlockType.ANALYSIS]}>{message.content}</AliceMarkdown>
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
                {message.references && hasAnyReferences(message.references) &&
                    <DataClusterManager dataCluster={message.references} isEditable={false} />
                }
                <Box className={classes.metadataContainer}>
                    {message.step && (
                        <Tooltip title="Task or source that produced this message" arrow>
                            <Typography variant="caption" className={classes.metadata}>
                                Step: {message.step}
                            </Typography>
                        </Tooltip>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default MessageFullView;