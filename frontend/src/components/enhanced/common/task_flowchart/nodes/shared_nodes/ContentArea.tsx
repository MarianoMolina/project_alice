import React, { useMemo, useState } from 'react';
import { BaseTaskData } from '../../utils/FlowChartUtils';
import { Accordion, AccordionDetails, AccordionSummary, Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { DataObject, ExpandMore } from '@mui/icons-material';
import { ApiType } from '../../../../../../types/ApiTypes';
import theme from '../../../../../../Theme';
import { useCardDialog } from '../../../../../../contexts/CardDialogContext';
import { NodeConfig } from './TaskTypeNodeDefinitions';
import { RequiredApis } from './RequiredApisArea';
import { formatCamelCaseString } from '../../../../../../utils/StyleUtils';
import PromptParsedView from '../../../../prompt/PromptParsedView';

// Component for the content area
interface NodeContentAreaProps {
    data: BaseTaskData;
    nodeConfig: NodeConfig | null;
    requiredApis: ApiType[];
}

export const NodeContentArea: React.FC<NodeContentAreaProps> = ({ data, nodeConfig, requiredApis }) => {
    const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
    const { selectCardItem } = useCardDialog();
    const taskTemplate = useMemo(() =>
        data?.templates?.task_template || undefined
        , [data?.templates]);

    const systemTemplate = useMemo(() =>
        data?.agent?.system_message || undefined
        , [data?.agent]);


    const handleViewPrompt = (event: React.MouseEvent) => {
        event.stopPropagation();
        setIsPromptDialogOpen(true);
    };

    const handleClosePromptDialog = () => {
        setIsPromptDialogOpen(false);
    };
    return (
        <Stack spacing={1}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 1
                }}
            >
                <Typography
                    className="text-sm"
                    color={theme.palette.primary.dark}
                >
                    {formatCamelCaseString(data.task_name)}
                </Typography>
                {taskTemplate && (
                    <Tooltip title="View task template with inputs">
                        <IconButton
                            size="small"
                            onClick={handleViewPrompt}
                            sx={{
                                color: theme.palette.primary.dark,
                                flexShrink: 0,
                                '&:hover': {
                                    color: theme.palette.primary.main,
                                    backgroundColor: theme.palette.action.hover,
                                }
                            }}
                        >
                            <DataObject fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <Accordion
                sx={{
                    backgroundColor: theme.palette.secondary.light,
                    color: theme.palette.primary.dark,
                    borderRadius: theme.shape.borderRadius
                }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="caption">Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={2}>
                        {nodeConfig?.getContent?.(data, selectCardItem)}
                        <RequiredApis apis={requiredApis} />
                    </Stack>
                </AccordionDetails>
            </Accordion>

            <Dialog
                open={isPromptDialogOpen}
                onClose={handleClosePromptDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Task Template Preview
                </DialogTitle>
                <DialogContent>
                    {taskTemplate && (
                        <PromptParsedView
                            prompt={taskTemplate}
                            systemPrompt={systemTemplate}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Stack>
    );
};