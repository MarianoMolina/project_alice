import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Alert,
    IconButton,
    Stack,
    useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { UserCheckpoint } from '../../../types/UserCheckpointTypes';
import EnhancedSelect from '../common/enhanced_select/EnhancedSelect';
import UserCheckpointShortListView from './user_checkpoint/UserCheckpointShortListView';
import { SelectInput } from '../common/inputs/SelectInput';
import TitleBox from '../common/inputs/TitleBox';
import { CollectionName, CollectionPopulatedType } from '../../../types/CollectionTypes';

interface UserCheckpointManagerProps {
    userCheckpoints: { [key: string]: UserCheckpoint | null };
    availableNodes: string[];
    onChange: (checkpoints: { [key: string]: UserCheckpoint | null }) => void;
    isEditMode: boolean;
    fetchPopulatedItem: <T extends CollectionName>(collectionName: T, itemId?: string | null) => Promise<CollectionPopulatedType[T] | CollectionPopulatedType[T][]>;
}

interface CheckpointRow {
    id: string;
    nodeName: string;
    checkpoint: UserCheckpoint | null;
}

const UserCheckpointManager: React.FC<UserCheckpointManagerProps> = ({
    userCheckpoints,
    availableNodes,
    onChange,
    isEditMode,
    fetchPopulatedItem
}) => {
    const isMobile = useMediaQuery('(max-width:900px)');
    const [rows, setRows] = useState<CheckpointRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    // Initialize rows from existing checkpoints
    useEffect(() => {
        console.log('useEffect triggered with userCheckpoints:', userCheckpoints);
        const initialRows = Object.entries(userCheckpoints || {}).map(([nodeName, checkpoint]) => ({
            id: Math.random().toString(36).substr(2, 9),
            nodeName,
            checkpoint
        }));
        setRows(initialRows);
    }, [userCheckpoints]);

    // Get available node options (excluding already selected ones)
    const getAvailableNodeOptions = (currentRow: CheckpointRow) => {
        const selectedNodes = rows
            .filter(row => row.id !== currentRow.id)
            .map(row => row.nodeName);
        return availableNodes.filter(node => !selectedNodes.includes(node));
    };

    const handleNodeNameChange = (rowId: string, value: string | string[] | undefined) => {
        if (typeof value !== 'string') return;

        setRows(prevRows => {
            const newRows = prevRows.map(row =>
                row.id === rowId ? { ...row, nodeName: value } : row
            );
            updateParentState(newRows);
            return newRows;
        });
    };

    const handleCheckpointSelect = async (rowId: string, selectedIds: string[]) => {
        try {
            if (selectedIds.length > 0) {
                const result = await fetchPopulatedItem('usercheckpoints', selectedIds[0]);
                const checkpoint = Array.isArray(result) ? result[0] : result;

                setRows(prevRows => {
                    const newRows = prevRows.map(row =>
                        row.id === rowId ? { ...row, checkpoint: checkpoint as UserCheckpoint } : row
                    );
                    updateParentState(newRows);
                    return newRows;
                });
            } else {
                setRows(prevRows => {
                    const newRows = prevRows.map(row =>
                        row.id === rowId ? { ...row, checkpoint: null } : row
                    );
                    updateParentState(newRows);
                    return newRows;
                });
            }
        } catch (error) {
            console.error('Error selecting checkpoint:', error);
        }
    };

    const addRow = () => {
        if (rows.length >= availableNodes.length) {
            setError('All available nodes have been assigned checkpoints');
            return;
        }
        const newRow = {
            id: Math.random().toString(36).substr(2, 9),
            nodeName: '',
            checkpoint: null
        };
        setRows(prevRows => [...prevRows, newRow]);
        setError(null);
    };

    const removeRow = (rowId: string) => {
        setRows(prevRows => {
            const newRows = prevRows.filter(row => row.id !== rowId);
            updateParentState(newRows);
            return newRows;
        });
        setError(null);
    };

    const updateParentState = (currentRows: CheckpointRow[]) => {
        const checkpoints = currentRows.reduce((acc, row) => {
            if (row.nodeName) {
                acc[row.nodeName] = row.checkpoint;
            }
            return acc;
        }, {} as { [key: string]: UserCheckpoint | null });
        onChange(checkpoints);

        const hasIncompleteRows = currentRows.some(row => !row.nodeName || !row.checkpoint);
        if (hasIncompleteRows) {
            setError('Some checkpoints are incomplete. Both node name and checkpoint must be selected.');
        } else {
            setError(null);
        }
    };

    return (
        <TitleBox title="User Checkpoints">
            <Stack spacing={2}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {rows.map(row => (
                    <Box
                        key={row.id}
                        sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: 2,
                            alignItems: isMobile ? 'stretch' : 'flex-start',
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            position: 'relative'
                        }}
                    >
                        <Box sx={{ 
                            flex: isMobile ? 'auto' : 1,
                            width: isMobile ? '100%' : 'auto',
                            pr: isMobile ? 5 : 0 
                        }}>
                            <SelectInput
                                name={`node-name-${row.id}`}
                                label="Node Name"
                                value={row.nodeName}
                                onChange={(value) => handleNodeNameChange(row.id, value)}
                                options={getAvailableNodeOptions(row).map(node => ({
                                    value: node,
                                    label: node
                                }))}
                                disabled={!isEditMode}
                                required
                                fullWidth
                            />
                        </Box>

                        <Box sx={{ 
                            flex: isMobile ? 'auto' : 1,
                            width: isMobile ? '100%' : 'auto'
                        }}>
                            {row.nodeName && (
                                <EnhancedSelect
                                    key={`checkpoint-select-${row.id}-${row.nodeName}`}
                                    componentType="usercheckpoints"
                                    EnhancedView={UserCheckpointShortListView}
                                    selectedItems={row.checkpoint ? [row.checkpoint] : []}
                                    onSelect={(ids) => handleCheckpointSelect(row.id, ids)}
                                    isInteractable={isEditMode}
                                    label="Select Checkpoint"
                                    accordionEntityName={`checkpoint-${row.id}`}
                                    showCreateButton={true}
                                    activeAccordion={activeAccordion}
                                    onAccordionToggle={setActiveAccordion}
                                    description="Select a checkpoint to be used at this node. When the node is reached during execution, the user checkpoint will trigger and create a User Interaction request, stopping the execution until the user feedback is received."
                                />
                            )}
                        </Box>

                        {isEditMode && (
                            <IconButton
                                color="error"
                                onClick={() => removeRow(row.id)}
                                sx={{ 
                                    position: isMobile ? 'absolute' : 'relative',
                                    top: isMobile ? 8 : 'auto',
                                    right: isMobile ? 8 : 'auto',
                                    mt: isMobile ? 0 : 3
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}
                    </Box>
                ))}

                {isEditMode && (
                    <Button
                        onClick={addRow}
                        variant="outlined"
                        startIcon={<AddIcon />}
                        fullWidth
                    >
                        Add Checkpoint
                    </Button>
                )}
            </Stack>
        </TitleBox>
    );
};

export default UserCheckpointManager;