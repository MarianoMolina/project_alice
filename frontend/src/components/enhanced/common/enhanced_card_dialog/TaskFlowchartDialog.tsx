import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import TaskFlowchart from '../../common/task_flowchart/FlowChart';

const PromptParsedDialog: React.FC = () => {
    const {
        selectedTaskFlowchartItem,
        isTaskFlowchartDialogOpen, 
        closeTaskFlowchartDialog,
    } = useCardDialog();

    if (!selectedTaskFlowchartItem) return null;

    let title = `Task: ${selectedTaskFlowchartItem.task_name}` || 'Task Flowchart';

    return (
        <Dialog
            open={isTaskFlowchartDialogOpen}
            onClose={closeTaskFlowchartDialog}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                <TaskFlowchart task={selectedTaskFlowchartItem} height={800} miniMap />
            </DialogContent>
        </Dialog>
    );
};

export default PromptParsedDialog;