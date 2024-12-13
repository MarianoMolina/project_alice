/**
 * BaseDbElement is a generic component for handling CRUD operations on database items.
 * It provides a flexible way to render, create, view, and edit items from a specified collection.
 *
 * @template T - The type of the database item being handled
 *
 * @param {BaseDbElementProps<T>} props - The props for the BaseDbElement component
 * @returns {React.ReactElement} A rendered element based on the provided render function
 *
 * @example
 * <BaseDbElement<User>
 *   collectionName="users"
 *   itemId="123"
 *   mode="view"
 *   fetchAll={false}
 *   isInteractable={true}
 *   onInteraction={(user) => console.log(user)}
 *   onSave={(savedUser) => console.log(savedUser)}
 *   render={(items, item, onChange, mode, handleSave) => (
 *     // Your render logic here
 *   )}
 * />
 */

/**
 * Props for the BaseDbElement component
 *
 * @template T - The type of the database item being handled
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useApi } from '../../../../contexts/ApiContext';
import { CollectionName, CollectionPopulatedType, CollectionType } from '../../../../types/CollectionTypes';
import Logger from '../../../../utils/Logger';
import { globalEventEmitter } from '../../../../utils/EventEmitter';

export interface BaseDbElementProps<T extends CollectionType[CollectionName] | CollectionPopulatedType[CollectionName]> {
  /**
   * The name of the collection in the database
   */
  collectionName: CollectionName;

  /**
   * The ID of the item to fetch (if in view or edit mode)
   */
  itemId?: string;
  partialItem?: Partial<T>;

  /**
   * The mode of operation: 'create', 'view', or 'edit'
   */
  mode: 'create' | 'view' | 'edit';

  /**
   * Whether to fetch all items from the collection or just a single item
   */
  fetchAll: boolean;

  /**
   * Whether the rendered item should be interactable (clickable)
   */
  isInteractable?: boolean;

  /**
   * Callback function triggered when an interactable item is clicked
   */
  onInteraction?: (item: T) => void;

  /**
   * Callback function triggered after an item is successfully saved
   */
  onSave?: (savedItem: T) => void;

  /**
   * Callback function triggered after an item is successfully deleted
   */
  onDelete?: (deletedItem: T) => Promise<void>;

  /**
   * Function to render the content based on the fetched data and current mode
   *
   * @param items - Array of items if fetchAll is true, null otherwise
   * @param item - Single item if fetchAll is false, null otherwise
   * @param onChange - Function to update the item's data
   * @param mode - Current mode of operation
   * @param handleSave - Function to trigger the save operation
   * @param onDelete - Function to delete the item
   * @returns React node to be rendered
   */
  render: (
    items: T[] | null,
    item: T | null,
    onChange: (newItem: Partial<T>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: T) => Promise<void>,
  ) => React.ReactNode;
}

function BaseDbElement<T extends CollectionType[CollectionName] | CollectionPopulatedType[CollectionName]>({
  collectionName,
  itemId,
  partialItem,
  mode,
  fetchAll,
  isInteractable = false,
  onInteraction,
  onSave,
  onDelete,
  render,
}: BaseDbElementProps<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { fetchItem, createItem, updateItem, deleteItem } = useApi();
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (fetchAll) {
        const data = await fetchItem(collectionName);
        setItems(data as T[]);
      } else if (itemId && mode !== 'create') {
        const data = await fetchItem(collectionName, itemId);
        setItem(data as T);
      } else if (mode === 'create') {
        setItem(partialItem as T || {} as T);
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch data');
      Logger.error(err as string);
    } finally {
      setLoading(false);
    }
  }, [collectionName, itemId, mode, fetchAll, fetchItem, partialItem]);

  useEffect(() => {
    fetchData();

    // Subscribe to events
    const eventTypes = ['created', 'updated', 'deleted'];
    const eventHandlers: { [key: string]: (item: T) => void } = {};

    if (fetchAll) {
      eventTypes.forEach(eventType => {
        const handler = () => {
          fetchData();
        };
        eventHandlers[`${eventType}:${collectionName}`] = handler;
        globalEventEmitter.on(`${eventType}:${collectionName}`, handler);
      });
    } else if (itemId) {
      eventTypes.forEach(eventType => {
        const handler = (updatedItem: T) => {
          if (updatedItem._id === itemId) {
            if (eventType === 'deleted') {
              setItem(null);
            } else {
              setItem(updatedItem);
            }
          }
        };
        eventHandlers[`${eventType}:${collectionName}`] = handler;
        globalEventEmitter.on(`${eventType}:${collectionName}`, handler);
      });
    }

    // Cleanup function to remove event listeners
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        globalEventEmitter.off(event, handler);
      });
    };
  }, [collectionName, itemId, fetchAll, fetchData]);
  
  // Memoize handlers to prevent unnecessary re-renders
  const handleChange = useCallback(
    (newItem: Partial<T>) => {
      if (mode !== 'view') Logger.debug('[BaseDbElement] handleChange', {
        prevId: item?._id,
        newId: newItem._id,
        isIdentical: item === newItem
      });
      setItem(prevItem => ({ ...prevItem, ...newItem } as T));
    }, [item, mode]);

  const handleSave = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    try {
      let savedItem;
      if (mode === 'create') {
        savedItem = await createItem(collectionName, item);
      } else {
        savedItem = await updateItem(collectionName, itemId!, item);
      }
      setItem(savedItem as T);
      setError(null);
      if (onSave) {
        onSave(savedItem as T);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to save item');
      Logger.error(err as string);
    } finally {
      setLoading(false);
    }
  }, [item, mode, createItem, updateItem, collectionName, itemId, onSave]);

  const handleDelete = useCallback(async () => {
    if (!item) return;
    try {
      const bool = await deleteItem(collectionName, itemId!);
      if (!bool) return;
      setLoading(true);
      setItem(null);
      setError(null);
      Logger.debug('BaseDBElement handleDelete', { item , onDelete});
      if (onDelete) {
        onDelete(item as T);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to delete item');
      Logger.error(err as string);
    } finally {
      setLoading(false);
    }
  }, [item, deleteItem, collectionName, itemId, onDelete]);

  const handleClick = useCallback(() => {
    if (isInteractable && onInteraction && item) {
      onInteraction(item);
    }
  }, [isInteractable, onInteraction, item]);

  // Memoize content to prevent unnecessary re-renders
  const content = useMemo(
    () => render(
      items, 
      item, 
      handleChange, 
      mode, 
      handleSave, 
      handleDelete
    ), [items, item, handleChange, mode, handleSave, render, handleDelete]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Box className="max-w-full" {...(isInteractable && { onClick: handleClick })}>
      {content}
    </Box>
  );
}

export default BaseDbElement;