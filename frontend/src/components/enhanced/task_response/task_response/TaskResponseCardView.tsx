import React from 'react';
import {
    Typography,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { PopulatedTaskResponse, TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import { CommandLineLog } from '../../../ui/markdown/CommandLog';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import { styled } from '@mui/material/styles';
import CommonCardView from '../../common/enhanced_component/CardView';
import { AccessTime, CheckCircle, Error, Warning, Output, Code, BugReport, DataObject, Analytics, Terminal } from '@mui/icons-material';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import EmbeddingChunkViewer from '../../embedding_chunk/embedding_chunk/EmbeddingChunkViewer';
import TaskResponseViewer from './TaskResponseViewer';

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

    const populatedItem = item as PopulatedTaskResponse

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

    const AccordionSection = ({ title, content, disabled = false, expanded = false }: { title: string, content: React.ReactNode, disabled?: boolean, expanded?: boolean }) => (
        <Accordion disabled={disabled} defaultExpanded={expanded}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {content}
            </AccordionDetails>
        </Accordion>
    );

    const embeddingChunkViewer = populatedItem.embedding && populatedItem.embedding?.length > 0 ?
        populatedItem.embedding.map((chunk, index) => (
            <EmbeddingChunkViewer
                key={chunk._id || `embedding-${index}`}
                item={chunk}
                items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
        )) : <Typography>No embeddings available</Typography>;

    const exitCodeProps = getExitCodeProps(populatedItem.result_code);

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
            icon: exitCodeProps.icon,
            primary_text: "Status",
            secondary_text: populatedItem.status
        },
        {
            icon: <AccessTime />,
            primary_text: "Execution Time",
            secondary_text: populatedItem.createdAt ? new Date(populatedItem.createdAt).toLocaleString() : 'N/A'
        },
        {
            icon: <Code />,
            primary_text: "Inputs",
            secondary_text: (
                <AccordionSection
                    title="Inputs"
                    content={<CodeBlock language="json" code={JSON.stringify(populatedItem.task_inputs, null, 2)} />}
                    disabled={!populatedItem.task_inputs}
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
                        <AliceMarkdown showCopyButton>{populatedItem.task_outputs as string}</AliceMarkdown>
                    }
                    disabled={!populatedItem.task_outputs}
                />
            )
        },
        {
            icon: <Output />,
            primary_text: "Output",
            secondary_text: (
                <AccordionSection
                    title="Node Outputs"
                    content={
                        populatedItem.node_references ? <TaskResponseViewer item={item} items={null} onChange={() => null} mode={'view'} handleSave={async () => { }} /> : <Typography>No output content available</Typography>
                    }
                    disabled={!populatedItem.node_references?.length}
                />
            )
        },
        {
            icon: <BugReport />,
            primary_text: "Diagnostics",
            secondary_text: (
                <AccordionSection
                    title="Diagnostics"
                    content={
                        <Box className="bg-gray-50 rounded overflow-hidden">
                            <Box className="flex items-center gap-2 px-3 py-2 bg-gray-100">
                                <Terminal fontSize="small" className="text-gray-600" />
                                <Typography variant="subtitle2" className="text-gray-600">
                                    Output
                                </Typography>
                            </Box>
                            <Box className="p-3">
                                <CommandLineLog
                                    content={populatedItem.result_diagnostic ?? ''}
                                />
                            </Box>
                        </Box>}
                    disabled={!populatedItem.result_diagnostic}
                />
            )
        },
        {
            icon: <DataObject />,
            primary_text: "Execution History",
            secondary_text: (
                <AccordionSection
                    title='Execution History'
                    content={<CodeBlock language="json" code={JSON.stringify(populatedItem.execution_history, null, 2)} />}
                    disabled={!populatedItem.execution_history}
                />
            )
        },
        {
            icon: <DataObject />,
            primary_text: "Embedding",
            secondary_text: (
                <AccordionSection
                    title='Embedding'
                    content={embeddingChunkViewer}
                    disabled={!populatedItem.embedding?.length}
                />
            )
        },
        {
            icon: <Analytics />,
            primary_text: "Usage Metrics",
            secondary_text: populatedItem.usage_metrics && Object.keys(populatedItem.usage_metrics).length > 0 ? 
            (
                <AccordionSection
                    title="Usage Metrics"
                    content={<CodeBlock language="json" code={JSON.stringify(populatedItem.usage_metrics, null, 2)} />}
                    disabled={!populatedItem.usage_metrics}
                />
            ) : null
        }
    ];

    return (
        <CommonCardView
            elementType='Task Response'
            title={populatedItem.task_name}
            subtitle={populatedItem.task_description}
            id={item._id}
            listItems={listItems}
            item={populatedItem}
            itemType='taskresults'
        />
    );
};

export default TaskResponseCardView;