import React, { useState, useCallback } from 'react';
import { Box, FormControl, InputLabel } from '@mui/material';
import { PopulatedDataCluster } from '../../../../types/DataClusterTypes';
import { References } from '../../../../types/ReferenceTypes';
import DataClusterHeader from './DataClusterHeader';
import FlatReferenceView from './DataClusterFlatView';
import CategorizedReferenceView from './DataClusterCategorizedView';
import DataClusterEditingView from './DataClusterEditingView';
import ReferencesViewer from '../ReferencesViewer';
import { DataClusterManagerProps } from './DataClusterManagerTypes';
import { ViewType } from './DataClusterManagerTypes';
import Logger from '../../../../utils/Logger';
import theme from '../../../../Theme';

const DataClusterManager: React.FC<DataClusterManagerProps> = ({
    dataCluster,
    onDataClusterChange,
    isEditable = false,
    showEdit = true,
    showSelect = true,
    flatten = true,
    title = 'Data Cluster'
}) => {
    const [inEditMode, setInEditMode] = useState(false);
    const [editedCluster, setEditedCluster] = useState<PopulatedDataCluster | undefined>(dataCluster);
    const [viewType, setViewType] = useState<ViewType>(flatten ? 'flat' : 'categorized');

    Logger.debug('[DataClusterManager]', 'dataCluster', dataCluster);

    const toggleEdit = useCallback(() => {
        if (dataCluster) {
            setInEditMode && setInEditMode(prev => !prev);
        }
    }, [dataCluster]);

    const handleClusterChange = useCallback((newCluster: PopulatedDataCluster) => {
        setEditedCluster(newCluster);
        onDataClusterChange && onDataClusterChange(newCluster);
    }, [onDataClusterChange]);

    const localOnDataClusterChange = useCallback((newCluster: PopulatedDataCluster | undefined) => {
        handleClusterChange(newCluster || {});
    }, [handleClusterChange]);

    const handleDelete = useCallback((type: keyof References, index: number) => {
        if (!editedCluster || !isEditable) return;

        setEditedCluster(prev => {
            if (!prev || !Array.isArray(prev[type])) return prev;

            const newArray = [...prev[type]];
            newArray.splice(index, 1);

            return {
                ...prev,
                [type]: newArray
            };
        });
        onDataClusterChange && onDataClusterChange(editedCluster);
    }, [editedCluster, isEditable, onDataClusterChange]);

    const renderContent = () => {
        if (inEditMode && editedCluster) {
            return (
                <DataClusterEditingView
                    editedCluster={editedCluster}
                    onClusterChange={handleClusterChange}
                />
            );
        }

        switch (viewType) {
            case 'flat':
                return (
                    <Box>
                        <FlatReferenceView
                            editedCluster={editedCluster}
                            onDelete={handleDelete}
                            isEditable={isEditable}
                        />
                    </Box>
                );
            case 'categorized':
                return (
                    <Box>
                        <CategorizedReferenceView
                            editedCluster={editedCluster}
                            onDelete={handleDelete}
                            isEditable={isEditable}
                        />
                    </Box>
                );
            case 'reference':
                return editedCluster ? (
                    <Box>
                        <ReferencesViewer references={editedCluster} />
                    </Box>
                ) : null;
            default:
                return null;
        }
    };

    return (
        <FormControl fullWidth variant="outlined" sx={{ marginTop: 1, marginBottom: 1 }}>
            <InputLabel shrink sx={{ backgroundColor: theme.palette.primary.dark }}>{title}</InputLabel>
            <div className="relative p-4 border border-gray-200/60 rounded-lg ml-2 mr-2">
                <DataClusterHeader
                    editedCluster={editedCluster}
                    viewType={viewType}
                    setViewType={setViewType}
                    isEditable={isEditable}
                    showEdit={showEdit}
                    showSelect={showSelect}
                    onEdit={toggleEdit}
                    dataCluster={dataCluster}
                    onDataClusterChange={localOnDataClusterChange}
                    inEditMode={inEditMode}
                />
                <div className="mt-4" />
                {renderContent()}
            </div>
        </FormControl >
    );
};

export default DataClusterManager;
