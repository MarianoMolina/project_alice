import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { ToolCall } from '../../../../types/ParameterTypes';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import Logger from '../../../../utils/Logger';

interface ToolCallProps {
    toolCall: ToolCall;
}

const ToolCallView: React.FC<ToolCallProps> = ({ toolCall }) => {
    const [parsedArguments, setParsedArguments] = useState<any>(toolCall.function.arguments);
    Logger.debug('ToolCallView', 'ToolCall:', toolCall);
    useEffect(() => {
        if (typeof toolCall.function.arguments === 'string') {
            try {
                const parsed = JSON.parse(toolCall.function.arguments);
                setParsedArguments(parsed);
            } catch (error) {
                console.error('Failed to parse arguments string:', error);
                setParsedArguments(toolCall.function.arguments);
            }
        }
    }, [toolCall.function.arguments]);

    return (
        <Paper elevation={3} sx={{ my: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Tool Call: {toolCall.function.name}
            </Typography>
            {toolCall.id && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    ID: {toolCall.id}
                </Typography>
            )}
            <Typography>Arguments</Typography>
            <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                <CodeBlock language={'json'} code={JSON.stringify(parsedArguments, null, 2)} />
            </Box>
        </Paper>
    );
};

export default ToolCallView;