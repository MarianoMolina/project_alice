import { useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { CollectionElement, CollectionName, collectionNameToElementString, collectionNameToEnhancedComponent } from '../../../types/CollectionTypes';
import { useApi } from '../../../contexts/ApiContext';
import Logger from '../../../utils/Logger';
import { useDialog } from '../../../contexts/DialogContext';

interface ManageReferenceListProps<T extends CollectionElement> {
    collectionType: CollectionName;
    elementIds: string[];
    onListChange: (newIds: string[]) => void;
    isEditable?: boolean;
    title?: string;
}

function ManageReferenceList<T extends CollectionElement>({ 
    collectionType,
    elementIds,
    onListChange,
    isEditable = true,
    title
}: ManageReferenceListProps<T>) {
    const { fetchItem } = useApi();
    const [elements, setElements] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { selectCardItem } = useDialog();

    // Get the appropriate enhanced component for this collection type
    const EnhancedComponent = collectionNameToEnhancedComponent[collectionType];

    useEffect(() => {
        const loadElements = async () => {
            setIsLoading(true);
            try {
                const loadedElements = await Promise.all(
                    elementIds.map(id => fetchItem(collectionType, id))
                );
                setElements(loadedElements.filter(el => el !== null) as T[]);
            } catch (error) {
                console.error('Error loading elements:', error);
            }
            setIsLoading(false);
        };

        loadElements();
    }, [elementIds, collectionType, fetchItem]);

    const handleRemoveElement = (idToRemove: string) => {
        const newIds = elementIds.filter(id => id !== idToRemove);
        onListChange(newIds);
    };

    const handleAddExisting = () => {
        // TODO: Implement adding existing elements
        console.log('Add existing element');
    };

    const handleCreateNew = () => {
        // TODO: Implement creating new element
        console.log('Create new element');
    };

    if (isLoading) {
        return <Typography>Loading...</Typography>;
    }
    Logger.info('EnhancedSelect - selected items:', EnhancedComponent, elements);
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2 
            }}>
                {title && <Typography variant="h6">{title}</Typography>}
                {isEditable && (
                    <Box>
                        <IconButton 
                            onClick={handleAddExisting}
                            size="small"
                            title="Add existing element"
                        >
                            <Add />
                        </IconButton>
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {elements.map((element) => (
                    <Box 
                        key={element._id}
                        sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }}>
                            <EnhancedComponent
                                itemId={element._id}
                                items={null}
                                mode="shortList"
                                onChange={() => {}}
                                handleSave={async () => {}}
                                onView = {(item: any) => {
                                    Logger.debug('Viewing item:', item);
                                    if (item._id) {
                                        selectCardItem(collectionNameToElementString[collectionType], item._id);
                                    }
                                }}
                            />
                        </Box>
                        {isEditable && (
                            <IconButton
                                onClick={() => element._id && handleRemoveElement(element._id)}
                                size="small"
                                sx={{ ml: 1 }}
                            >
                                <Delete />
                            </IconButton>
                        )}
                    </Box>
                ))}
                {elements.length === 0 && <Typography>No elements</Typography>}
            </Box>
        </Box>
    );
}

export default ManageReferenceList;