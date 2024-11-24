import React, { useCallback, useMemo, useState } from 'react';
import { Box, IconButton, Accordion, AccordionSummary, AccordionDetails, Typography, Chip, Tooltip } from '@mui/material';
import { Edit, Close, ExpandMore, Add, Info } from '@mui/icons-material';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import useStyles from './EnhancedSelectStyles';
import { CollectionName, CollectionType, CollectionElementString, collectionNameToElementString, collectionNameToEnhancedComponent } from '../../../../types/CollectionTypes';
import Logger from '../../../../utils/Logger';

interface EnhancedSelectProps<T extends CollectionType[CollectionName]> {
  componentType: CollectionName;
  EnhancedView: React.ComponentType<any>;
  selectedItems: T[];
  onSelect: (selectedIds: string[]) => void;
  isInteractable: boolean;
  multiple?: boolean;
  label: string;
  activeAccordion: string | null;
  onAccordionToggle: (accordionName: string | null) => void;
  onView?: (id: string) => void;
  accordionEntityName: string;
  showCreateButton?: boolean;
  description?: string;
  filters?: Record<string, any>;
}

function EnhancedSelect<T extends CollectionType[CollectionName]>({
  componentType,
  EnhancedView,
  selectedItems,
  onSelect,
  isInteractable,
  multiple = false,
  label,
  activeAccordion,
  onAccordionToggle,
  accordionEntityName,
  showCreateButton = false,
  description,
  filters
}: EnhancedSelectProps<T>) {
  const classes = useStyles();
  const { selectFlexibleItem, selectCardItem } = useCardDialog();
  const [localExpanded, setLocalExpanded] = useState(false);
  Logger.debug('EnhancedSelect', { componentType, selectedItems, isInteractable, multiple, label, activeAccordion, accordionEntityName, showCreateButton, filters });

  const EnhancedComponent = collectionNameToEnhancedComponent[componentType];

  const accordionName = `select-${accordionEntityName}`;
  const isExpanded = activeAccordion === accordionName || localExpanded;

  const handleToggle = () => {
    if (multiple) {
      onAccordionToggle(isExpanded ? null : accordionName);
    } else {
      setLocalExpanded(!isExpanded);
    }
  };

  const handleDelete = useCallback((itemToDelete: T) => {
    const updatedIds = selectedItems
      .filter(item => item._id !== itemToDelete._id)
      .map(item => item._id!);
    onSelect(updatedIds);
  }, [selectedItems, onSelect]);

  const collectionElementString = collectionNameToElementString[componentType] as CollectionElementString;

  const handleCreate = () => {
    selectFlexibleItem(collectionElementString, 'create');
  };

  const commonProps = useMemo(() => ({
    items: null,
    onChange: () => { },
    mode: 'view',
    handleSave: async () => undefined,
  }), []);

  const handleInteraction = useCallback((item: T) => {
    const newSelectedIds = multiple
      ? [...selectedItems.map(i => i._id!), item._id!]
      : [item._id!];
    onSelect(newSelectedIds);

    if (!multiple) {
      setLocalExpanded(false);
    }
  }, [multiple, selectedItems, onSelect]);

  const handleView = useCallback((item: T) => {
    selectCardItem(collectionElementString, item._id!);
  }, [selectCardItem, collectionElementString]);

  const memoizedEnhancedComponent = useMemo(() => (
    <EnhancedComponent
      mode="shortList"
      fetchAll={true}
      onInteraction={handleInteraction}
      onView={handleView}
      isInteractable={isInteractable}
      filters={filters} // Pass filters to EnhancedComponent
    />
  ), [EnhancedComponent, handleInteraction, handleView, isInteractable, filters]); // Add filters to dependencies

  const renderSelectedItem = useCallback((item: T) => (
    <Chip
      key={item._id}
      label={<EnhancedView item={item} {...commonProps} />}
      onDelete={multiple && isInteractable ? () => handleDelete(item) : undefined}
      onClick={() => selectCardItem(collectionElementString, item._id!)}
      className={classes.chip}
    />
  ), [classes.chip, isInteractable, multiple, selectCardItem, collectionElementString, commonProps, EnhancedView, handleDelete]);

  return (
    <Box className={classes.selectContainer}>
      <Box className={classes.chipContainer}>
        {selectedItems?.map(renderSelectedItem)}
        <Box className={classes.buttonContainer}>
          {description && (
            <Tooltip title={description}>
              <IconButton
                size="small"
              >
                <Info />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isInteractable ? 'Edit' : ''}>
            <IconButton
              onClick={handleToggle}
              disabled={!isInteractable}
              size="small"
              className={classes.editButton}
            >
              {isExpanded ? <Close /> : <Edit />}
            </IconButton>
          </Tooltip>
          {showCreateButton && (
            <Tooltip title={isInteractable ? 'Create' : ''}>
              <IconButton
                onClick={handleCreate}
                disabled={!isInteractable}
                size="small"
                className={classes.createButton}
              >
                <Add />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Accordion expanded={isExpanded} onChange={handleToggle}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>{label}{multiple ? ' (multiple)' : null}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {memoizedEnhancedComponent}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default EnhancedSelect;