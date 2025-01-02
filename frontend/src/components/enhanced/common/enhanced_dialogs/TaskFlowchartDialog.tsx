import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useDialog } from '../../../../contexts/DialogContext';
import TaskFlowchart from '../../common/task_flowchart/FlowChart';
import CardTitle from '../enhanced_component/CardTitle';

const FlowChartDialog: React.FC = () => {
    const {
        selectedTaskFlowchartItem,
        isTaskFlowchartDialogOpen, 
        closeTaskFlowchartDialog,
    } = useDialog();

    if (!selectedTaskFlowchartItem) return null;

    let title = selectedTaskFlowchartItem.task_name || 'Task Flowchart';

    return (
        <Dialog
            open={isTaskFlowchartDialogOpen}
            onClose={closeTaskFlowchartDialog}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <CardTitle title={title} elementType='Task' item={selectedTaskFlowchartItem}  itemType='tasks'/>
            </DialogTitle>
            <DialogContent>
                <TaskFlowchart task={selectedTaskFlowchartItem} height={800} miniMap />
            </DialogContent>
        </Dialog>
    );
};

export default FlowChartDialog;