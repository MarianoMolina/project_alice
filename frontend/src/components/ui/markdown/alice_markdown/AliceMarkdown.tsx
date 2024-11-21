import React, { FC } from 'react';
import { parseMarkdownBlocks, BaseBlock } from './ParserUtil';
import CustomMarkdown from '../CustomMarkdown';
import { AliceDocumentBlockComponent } from './AliceDocumentBlock';
import { AnalysisBlockComponent } from './AnalysisBlock';
import { ReactElement } from 'react-markdown/lib/react-markdown';
import { Box, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNotification } from '../../../../contexts/NotificationContext';
import useStyles from '../MarkdownStyles';
import clsx from 'clsx';
import Logger from '../../../../utils/Logger';

// Define the enums
export enum CustomBlockType {
    ALICE_DOCUMENT = 'aliceDocument',
    ANALYSIS = 'analysis'
}

export enum RoleType {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
    TOOL = 'tool'
}

interface AliceMarkdownProps {
    className?: string;
    children: string;
    enabledBlocks?: CustomBlockType[];
    showCopyButton?: boolean;
    role?: RoleType;
}

const AliceMarkdown: FC<AliceMarkdownProps> = ({ 
    children, 
    className,
    enabledBlocks = [],
    showCopyButton = false,
    role = RoleType.ASSISTANT,
}): ReactElement => {
    const classes = useStyles();
    const { addNotification } = useNotification();
    
    // Get role-based class name
    const getRoleClassName = () => {
        switch (role) {
            case RoleType.USER:
                return classes.userMessage;
            case RoleType.TOOL:
                return classes.toolMessage;
            case RoleType.SYSTEM:
                return classes.systemMessage;
            case RoleType.ASSISTANT:
            default:
                return classes.assistantMessage;
        }
    };
    
    const blocks = React.useMemo((): BaseBlock[] => {
        if (enabledBlocks.length > 0) {
            return parseMarkdownBlocks(children, enabledBlocks);
        }
        return [{
            type: 'markdown',
            content: children,
            data: undefined
        }];
    }, [children, enabledBlocks]);

    const isBlockEnabled = (blockType: string): boolean => {
        const normalizedBlockType = blockType.replace('CustomBlock', '');
        return enabledBlocks.some(type => type === normalizedBlockType);
    };
    
    const handleCopy = () => {
        const cleanContent = children.replace(/<\/?[^>]+(>|$)/g, '');
        navigator.clipboard.writeText(cleanContent).then(() => {
            addNotification('Content copied to clipboard', 'success');
        }).catch((error) => {
            Logger.error('Failed to copy content:', error);
            addNotification('Failed to copy content', 'error');
        });
    };

    const renderBlock = (block: BaseBlock, index: number) => {
        if (block.type === 'markdown') {
            return (
                <CustomMarkdown key={index} className={className}>
                    {block.content}
                </CustomMarkdown>
            );
        }
        
        if (isBlockEnabled(CustomBlockType.ALICE_DOCUMENT) && 
            block.type === 'aliceDocumentCustomBlock') {
            return (
                <AliceDocumentBlockComponent
                    key={index}
                    node={{
                        type: 'aliceDocumentCustomBlock',
                        data: block.data,
                        children: [{
                            type: 'text',
                            value: block.content
                        }]
                    }}
                />
            );
        }
        
        if (isBlockEnabled(CustomBlockType.ANALYSIS) && 
            block.type === 'analysisCustomBlock') {
            return (
                <AnalysisBlockComponent
                    key={index}
                    node={{
                        type: 'analysisCustomBlock',
                        data: block.data,
                        children: [{
                            type: 'text',
                            value: block.content
                        }]
                    }}
                />
            );
        }
        
        return null;
    };
    Logger.debug('[Markdown:AliceMarkdown] Blocks to render:', blocks);

    return (
        <Box className={clsx("relative", getRoleClassName())}>
            {showCopyButton && (
                <Box className="absolute top-2 right-2 z-10">
                    <Tooltip title="Copy content">
                        <IconButton
                            onClick={handleCopy}
                            size="small"
                            className="bg-white/10 hover:bg-white/20"
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
            
            <div className={className}>
                {blocks.map(renderBlock)}
            </div>
        </Box>
    );
};

export default AliceMarkdown;