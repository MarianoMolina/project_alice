import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { PopulatedDataCluster } from '../../../../types/DataClusterTypes';
import { References } from '../../../../types/ReferenceTypes';
import { CollectionType } from '../../../../types/CollectionTypes';
import ReferenceChip from '../ReferenceChip';
import { REFERENCE_CONFIG } from './DataClusterManagerTypes';
import { useApi } from '../../../../contexts/ApiContext';
import { useDialog } from '../../../../contexts/DialogContext';

interface DataClusterEditingViewProps {
    editedCluster: PopulatedDataCluster;
    onClusterChange: (newCluster: PopulatedDataCluster) => void;
}

const DataClusterEditingView: React.FC<DataClusterEditingViewProps> = ({
    editedCluster,
    onClusterChange
}) => {
    const { fetchPopulatedItem } = useApi();
    const { selectDialog } = useDialog();
    const [selectedIds, setSelectedIds] = useState<{ [K in keyof References]?: string[] }>({});

    const handleAddClick = (referenceType: keyof References) => {
        const config = REFERENCE_CONFIG.find(c => c.key === referenceType);
        if (!config?.collectionName || !config.EnhancedView) return;

        const existingRefs = editedCluster[referenceType] || [];
        setSelectedIds(prev => ({
            ...prev,
            [referenceType]: existingRefs.map(item => 
                typeof item === 'string' ? item : item._id!
            )
        }));

        selectDialog<CollectionType[typeof config.collectionName]>(
            config.collectionName,
            config.EnhancedView,
            `Select ${config.title}`,
            async (item) => {
                const currentIds = selectedIds[referenceType] || [];
                const newIds = [...currentIds, item._id!];
                await handleReferenceSelection(config.key, newIds);
            },
            existingRefs as any[],
        );
    };

    const handleDelete = (type: keyof References, index: number) => {
        const newRefs = [...(editedCluster[type] || [])];
        newRefs.splice(index, 1);

        onClusterChange({
            ...editedCluster,
            [type]: newRefs
        });
    };

    const renderReferenceChips = (config: typeof REFERENCE_CONFIG[number], references: any[]) => {
        return references.map((reference, index) => (
            <ReferenceChip
                key={typeof reference === 'string' ? `string-${index}` : reference._id}
                reference={reference}
                type={config.chipType}
                view={true}
                delete={true}
                onDelete={() => handleDelete(config.key, index)}
            />
        ));
    };

    const handleReferenceSelection = async (type: keyof References, ids: string[]) => {
        if (!ids.length || !type) return;

        const config = REFERENCE_CONFIG.find(c => c.key === type);
        if (!config?.collectionName) return;
        
        setSelectedIds(prev => ({ ...prev, [type]: ids }));

        const newRefs = await Promise.all(
            ids.map(id => fetchPopulatedItem(config.collectionName!, id))
        );

        onClusterChange({
            ...editedCluster,
            [type]: newRefs
        });
    };

    const renderSection = (config: typeof REFERENCE_CONFIG[number]) => {
        const references = editedCluster[config.key] || [];

        return (
            <Box key={config.key} className="space-y-2 mb-4">
                <Box className="flex items-center justify-between">
                    <Typography variant="subtitle1" className="font-medium">
                        {config.title}
                    </Typography>
                    {config.collectionName && (
                        <IconButton 
                            size="small" 
                            onClick={() => handleAddClick(config.key)}
                            className="bg-white/50 hover:bg-white/75"
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
                <Box className="flex flex-wrap gap-2">
                    {renderReferenceChips(config, references)}
                </Box>
            </Box>
        );
    };

    return (
        <Box className="space-y-4">
            {REFERENCE_CONFIG.map(renderSection)}
        </Box>
    );
};

export default DataClusterEditingView;