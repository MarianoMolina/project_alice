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
import React, { useState, useEffect, useCallback } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useApi } from '../../../../context/ApiContext';
import { CollectionName, CollectionType } from '../../../../types/CollectionTypes';

export interface BaseDbElementProps<T extends CollectionType[CollectionName]> {
  /**
   * The name of the collection in the database
   */
  collectionName: CollectionName;

  /**
   * The ID of the item to fetch (if in view or edit mode)
   */
  itemId?: string;

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
   * Function to render the content based on the fetched data and current mode
   *
   * @param items - Array of items if fetchAll is true, null otherwise
   * @param item - Single item if fetchAll is false, null otherwise
   * @param onChange - Function to update the item's data
   * @param mode - Current mode of operation
   * @param handleSave - Function to trigger the save operation
   * @returns React node to be rendered
   */
  render: (
    items: T[] | null,
    item: T | null,
    onChange: (newItem: Partial<T>) => void,
    mode: 'create' | 'view' | 'edit',
    handleSave: () => Promise<void>
  ) => React.ReactNode;
}
function BaseDbElement<T extends CollectionType[CollectionName]>({
  collectionName,
  itemId,
  mode,
  fetchAll,
  isInteractable = false,
  onInteraction,
  onSave,
  render,
}: BaseDbElementProps<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { fetchItem, createItem, updateItem } = useApi();

  const fetchAllItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchItem(collectionName);
      setItems(data as T[]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchItem, collectionName]);

  const fetchSingleItem = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchItem(collectionName, itemId!);
      setItem(data as T);
      setError(null);
    } catch (err) {
      setError('Failed to fetch item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchItem, collectionName, itemId]);

  useEffect(() => {
    if (fetchAll) {
      fetchAllItems();
    }
    if (itemId && mode !== 'create') {
      fetchSingleItem();
    } else if (mode === 'create') {
      setItem({} as T);
    }
  }, [itemId, collectionName, mode, fetchAll, fetchAllItems, fetchSingleItem]);

  const handleSave = async () => {
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
      setError('Failed to save item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (newItem: Partial<T>) => {
    console.log('handleChange', newItem);
    setItem(prevItem => ({ ...prevItem, ...newItem } as T));
  };

  const handleClick = () => {
    if (isInteractable && onInteraction && item) {
      onInteraction(item);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const content = render(items, item, handleChange, mode, handleSave);

  return (
    <Box 
      onClick={handleClick} 
    >
      {content}
    </Box>
  );
}

export default BaseDbElement;