import React from 'react';
import { BaseTaskData } from '../../utils/FlowChartUtils';
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { ApiType } from '../../../../../../types/ApiTypes';
import theme from '../../../../../../Theme';
import { useCardDialog } from '../../../../../../contexts/CardDialogContext';
import { NodeConfig } from './TaskTypeNodeDefinitions';
import { RequiredApis } from './RequiredApisArea';

// Component for the content area
interface NodeContentAreaProps {
    data: BaseTaskData;
    nodeConfig: NodeConfig | null;
    requiredApis: ApiType[];
}

export const NodeContentArea: React.FC<NodeContentAreaProps> = ({ data, nodeConfig, requiredApis }) => {
    const { selectCardItem } = useCardDialog();

    return (
        <Stack spacing={1}>
            <Typography
                className="text-sm"
                color={theme.palette.primary.dark}
            >
                {data.task_name}
            </Typography>

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
        </Stack>
    );
};