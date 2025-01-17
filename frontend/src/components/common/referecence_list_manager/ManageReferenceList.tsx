import { useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { CollectionElement, CollectionName, collectionNameToEnhancedComponent } from '../../../types/CollectionTypes';
import { useApi } from '../../../contexts/ApiContext';

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
                            gap: 1
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }}>
                            <EnhancedComponent
                                item={element}
                                items={null}
                                mode="shortList"
                                onChange={() => {}}
                                handleSave={async () => {}}
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