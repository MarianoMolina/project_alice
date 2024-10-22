import React from 'react';
import {
    Typography,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import { CommandLineLog } from '../../../ui/markdown/CommandLog';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import { styled } from '@mui/material/styles';
import CommonCardView from '../../common/enhanced_component/CardView';
import { AccessTime, CheckCircle, Error, Warning, Output, Code, BugReport, DataObject, Analytics } from '@mui/icons-material';
import ReferencesViewer from '../../common/references/ReferencesViewer';
import CustomMarkdown from '../../../ui/markdown/CustomMarkdown';

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

const NodeReferenceSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    '&:last-child': {
        marginBottom: 0,
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

    const renderNodeReferences = () => {
        if (!item.node_references?.length) {
            return <Typography>No output content available</Typography>;
        }

        return (
            <Stack spacing={2}>
                {item.node_references.map((nodeResponse, index) => (
                    <NodeReferenceSection key={`${nodeResponse.node_name}-${index}`}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            {nodeResponse.node_name} {nodeResponse.exit_code !== undefined && (
                                <ExitCodeChip
                                    size="small"
                                    label={`Exit: ${nodeResponse.exit_code}`}
                                    className={getExitCodeProps(nodeResponse.exit_code).className}
                                    sx={{ ml: 1 }}
                                />
                            )}
                        </Typography>
                        <ReferencesViewer references={nodeResponse.references} />
                    </NodeReferenceSection>
                ))}
            </Stack>
        );
    };

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
            icon: <Output />,
            primary_text: "Output",
            secondary_text: (
                <AccordionSection
                    title="Node Outputs"
                    content={renderNodeReferences()}
                    disabled={!item.node_references?.length}
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
                        <CustomMarkdown>{item.task_outputs as string}</CustomMarkdown>
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
            item={item}
            itemType='taskresults'
        />
    );
};

export default TaskResponseCardView;