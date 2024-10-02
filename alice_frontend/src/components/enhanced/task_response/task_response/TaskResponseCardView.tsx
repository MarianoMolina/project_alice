import React from 'react';
import {
    Typography,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import { CommandLineLog } from '../../common/markdown/CommandLog';
import { CodeBlock } from '../../common/markdown/CodeBlock';
import { styled } from '@mui/material/styles';
import CommonCardView from '../../common/enhanced_component/CardView';
import { AccessTime, CheckCircle, Error, Warning, Output, Code, BugReport, DataObject, Analytics } from '@mui/icons-material';
import ReferencesViewer from '../../common/references/ReferencesViewer';

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
                return { label: 'Exit: 0', className: 'success', icon: <CheckCircle /> };
            case 1:
                return { label: 'Exit: 1', className: 'error', icon: <Error /> };
            default:
                return { label: `Exit: ${exitCode}`, className: 'warning', icon: <Warning /> };
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

    const exitCodeProps = getExitCodeProps(item.result_code);

    const listItems = [
        {
            icon: exitCodeProps.icon,
            primary_text: "Exit Code",
            secondary_text: (
                <ExitCodeChip
                    label={exitCodeProps.label}
                    className={exitCodeProps.className}
                    size="small"
                />
            )
        },
        {
            icon: <AccessTime />,
            primary_text: "Execution Time",
            secondary_text: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'
        },
        {
            icon: <Output />,
            primary_text: "Output",
            secondary_text: (
                item.references ? (
                    <ReferencesViewer references={item.references} />
                ) : (
                    <Typography>No output content available</Typography>
                )
            )
        },
        {
            icon: <Code />,
            primary_text: "Inputs",
            secondary_text: (
                <AccordionSection
                    title="Inputs"
                    content={<CodeBlock language="json" code={JSON.stringify(item.task_inputs, null, 2)} />}
                    disabled={!item.task_inputs}
                />
            )
        },
        {
            icon: <BugReport />,
            primary_text: "Diagnostics",
            secondary_text: (
                <AccordionSection
                    title="Diagnostics"
                    content={<CommandLineLog content={item.result_diagnostic ?? ''} />}
                    disabled={!item.result_diagnostic}
                />
            )
        },
        {
            icon: <DataObject />,
            primary_text: "Raw Output",
            secondary_text: (
                <AccordionSection
                    title="Raw Output"
                    content={
                        <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {typeof item.task_outputs === 'string' ? item.task_outputs : JSON.stringify(item.task_outputs, null, 2)}
                        </Typography>
                    }
                    disabled={!item.task_outputs}
                />
            )
        },
        {
            icon: <Analytics />,
            primary_text: "Usage Metrics",
            secondary_text: (
                <AccordionSection
                    title="Usage Metrics"
                    content={<CodeBlock language="json" code={JSON.stringify(item.usage_metrics, null, 2)} />}
                    disabled={!item.usage_metrics}
                />
            )
        }
    ];

    return (
        <CommonCardView
            elementType='TaskResponse'
            title={item.task_name}
            subtitle={item.task_description}
            id={item._id}
            listItems={listItems}
        />
    );
};

export default TaskResponseCardView;