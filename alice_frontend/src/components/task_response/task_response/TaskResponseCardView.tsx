import React from 'react';
import {
    Typography,
    Card,
    CardContent,
    Chip,
    Box,
} from '@mui/material';
import { TaskResponseComponentProps } from '../../../utils/TaskResponseTypes';
import { CommandLineLog } from '../CommandLog';
import { CodeBlock } from '../CodeBlock';
import { StringOutput } from '../StringOutput';
import { LLMChatOutput } from '../LLMChatOutput';
import { SearchOutput } from '../SearchOutput';
import { WorkflowOutput } from '../WorkflowOutput';

const TaskResponseCardView: React.FC<TaskResponseComponentProps> = ({
    item,
}) => {
    if (!item) {
        return <Typography>No task response data available.</Typography>;
    }

    const renderOutputContent = (content: any) => {
        if (!content || typeof content !== 'object') {
            return <Typography>No output content available</Typography>;
        }

        switch (content.output_type) {
            case 'StringOutput':
                return <StringOutput content={content.content} />;
            case 'LLMChatOutput':
                return <LLMChatOutput content={content.content} />;
            case 'SearchOutput':
                return <SearchOutput content={content.content} />;
            case 'WorkflowOutput':
                return <WorkflowOutput content={content.content} />;
            default:
                return <CodeBlock language="json" code={JSON.stringify(content, null, 2)} />;
        }
    };

    return (
        <Card elevation={3}>
            <CardContent>
                <Typography variant="h5" gutterBottom>Task Execution Report</Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{item.task_name}</Typography>
                    <Chip
                        label={item.status}
                        color={item.status === 'complete' ? 'success' : 'error'}
                    />
                </Box>

                <Typography variant="body1" paragraph>{item.task_description}</Typography>

                {item.task_inputs && (
                    <Box my={2}>
                        <Typography variant="h6">Inputs</Typography>
                        <CodeBlock language="json" code={JSON.stringify(item.task_inputs, null, 2)} />
                    </Box>
                )}

                {item.result_diagnostic && (
                    <Box my={2}>
                        <Typography variant="h6">Diagnostics</Typography>
                        <CommandLineLog content={item.result_diagnostic} />
                    </Box>
                )}

                {item.task_outputs && (
                    <Box my={2}>
                        <Typography variant="h6">Raw Output</Typography>
                        <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {typeof item.task_outputs === 'string' ? item.task_outputs : JSON.stringify(item.task_outputs, null, 2)}
                        </Typography>
                    </Box>
                )}

                {item.task_content && (
                    <Box my={2}>
                        <Typography variant="h6">Processed Output</Typography>
                        {renderOutputContent(item.task_content)}
                    </Box>
                )}

                {item.usage_metrics && (
                    <Box my={2}>
                        <Typography variant="h6">Usage Metrics</Typography>
                        <CodeBlock language="json" code={JSON.stringify(item.usage_metrics, null, 2)} />
                    </Box>
                )}

                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption">
                        Execution Time: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default TaskResponseCardView;