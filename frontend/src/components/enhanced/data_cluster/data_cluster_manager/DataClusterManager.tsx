import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { DataCluster } from '../../../../types/DataClusterTypes';
import { References } from '../../../../types/ReferenceTypes';
import DataClusterHeader from './DataClusterHeader';
import FlatReferenceView from './DataClusterFlatView';
import CategorizedReferenceView from './DataClusterCategorizedView';
import DataClusterEditingView from './DataClusterEditingView';
import { DataClusterManagerProps } from './DataClusterManagerTypes';

const DataClusterManager: React.FC<DataClusterManagerProps> = ({
    dataCluster,
    onDataClusterChange,
    isEditable = false,
    showEdit = true,
    showSelect = true,
    flatten = true
}) => {
    const [inEditMode, setInEditMode] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [editedCluster, setEditedCluster] = useState<DataCluster | undefined>(dataCluster);
    const [isFlatView, setIsFlatView] = useState(flatten);
    const [previousViewState, setPreviousViewState] = useState(flatten);

    const handleAction = useCallback((actionKey: string) => {
        switch (actionKey) {
            case 'edit':
                if (dataCluster) {
                    setPreviousViewState(isFlatView);
                    setInEditMode(true);
                }
                break;
            case 'save':
                handleSave()
                break;
            // case 'create':
            //     setEditedCluster(undefined);
            //     setInEditMode(true);
            //     setIsDirty(false);
            //     break;
            case 'cancel':
                setEditedCluster(dataCluster);
                setIsDirty(false);
                setInEditMode(false);
                setIsFlatView(previousViewState);
                break;
        }
    }, [dataCluster, editedCluster, onDataClusterChange, isEditable, isFlatView, previousViewState]);

    const handleSave = useCallback(() => {
        if (!editedCluster || !isEditable || !onDataClusterChange) return;
        onDataClusterChange(editedCluster);
        setIsDirty(false);
        setInEditMode(false);
        setIsFlatView(previousViewState);
    }, [editedCluster, onDataClusterChange, previousViewState]);

    const handleClusterChange = useCallback((newCluster: DataCluster) => {
        setEditedCluster(newCluster);
        setIsDirty(true);
    }, []);

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
        setIsDirty(true);
    }, [editedCluster, isEditable]);

    const renderContent = () => {
        if (inEditMode && editedCluster) {
            return (
                <DataClusterEditingView
                    editedCluster={editedCluster}
                    onClusterChange={handleClusterChange}
                />
            );
        }

        return (
            <Box className="pr-12">
                {isFlatView ? (
                    <FlatReferenceView
                        editedCluster={editedCluster}
                        onDelete={handleDelete}
                        isEditable={isEditable}
                    />
                ) : (
                    <CategorizedReferenceView
                        editedCluster={editedCluster}
                        onDelete={handleDelete}
                        isEditable={isEditable}
                    />
                )}
            </Box>
        );
    };

    return (
        <div className="relative p-4 border rounded-lg shadow-sm">
            <DataClusterHeader
                editedCluster={editedCluster}
                isFlatView={isFlatView}
                setIsFlatView={setIsFlatView}
                isEditable={isEditable}
                isDirty={isDirty}
                showEdit={showEdit}
                showSelect={showSelect}
                onAction={handleAction}
                dataCluster={dataCluster}
                onDataClusterChange={onDataClusterChange}
                inEditMode={inEditMode}
            />
            {renderContent()}
        </div>
    );
};

export default DataClusterManager;