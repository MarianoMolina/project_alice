import React from 'react';
import {
    Typography,
    Card,
    CardContent,
    Chip,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import { CommandLineLog } from '../CommandLog';
import { CodeBlock } from '../CodeBlock';
import { WorkflowOutput } from '../WorkflowOutput';
import { styled } from '@mui/material/styles';

const ExitCodeChip = styled(Chip)(({ theme }) => ({
    fontWeight: 'bold',
    '&.success': {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,
    },
    '&.warning': {
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.warning.contrastText,
    },
    '&.error': {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
    },
}));

const TaskResponseCardView: React.FC<TaskResponseComponentProps> = ({
    item,
}) => {
    if (!item) {
        return <Typography>No task response data available.</Typography>;
    }

    const getExitCodeProps = (exitCode: number) => {
        switch (exitCode) {
            case 0:
                return { label: 'Exit: 0', className: 'success' };
            case 1:
                return { label: 'Exit: 1', className: 'error' };
            default:
                return { label: `Exit: ${exitCode}`, className: 'warning' };
        }
    };

    const AccordionSection = ({ title, content, disabled = false }: { title: string, content: React.ReactNode, disabled?: boolean }) => (
        <Accordion disabled={disabled}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {content}
            </AccordionDetails>
        </Accordion>
    );

    return (
        <Card elevation={3}>
            <CardContent>
                <Typography variant="h5" gutterBottom>Task Execution Report</Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{item.task_name}</Typography>
                    <Box display="flex" gap={1}>
                        <ExitCodeChip
                            {...getExitCodeProps(item.result_code)}
                            size="small"
                        />
                        <Chip
                            label={item.status}
                            color={item.status === 'complete' ? 'success' : 'error'}
                            size="small"
                        />
                    </Box>
                </Box>

                <Typography variant="body1" paragraph>{item.task_description}</Typography>

                <AccordionSection
                    title="Output"
                    content={
                        item.task_content ? (
                            <WorkflowOutput content={item} />
                        ) : (
                            <Typography>No output content available</Typography>
                        )
                    }
                    disabled={!item.task_content}
                />

                <AccordionSection
                    title="Inputs"
                    content={<CodeBlock language="json" code={JSON.stringify(item.task_inputs, null, 2)} />}
                    disabled={!item.task_inputs}
                />

                <AccordionSection
                    title="Diagnostics"
                    content={<CommandLineLog content={item.result_diagnostic ?? ''} />}
                    disabled={!item.result_diagnostic}
                />

                <AccordionSection
                    title="Raw Output"
                    content={
                        <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {typeof item.task_outputs === 'string' ? item.task_outputs : JSON.stringify(item.task_outputs, null, 2)}
                        </Typography>
                    }
                    disabled={!item.task_outputs}
                />

                <AccordionSection
                    title="Usage Metrics"
                    content={<CodeBlock language="json" code={JSON.stringify(item.usage_metrics, null, 2)} />}
                    disabled={!item.usage_metrics}
                />

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