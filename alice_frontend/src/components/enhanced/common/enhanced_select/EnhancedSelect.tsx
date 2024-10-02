import React from 'react';
import { Box, IconButton, Accordion, AccordionSummary, AccordionDetails, Typography, Chip, Divider } from '@mui/material';
import { Edit, Close, ExpandMore, Add } from '@mui/icons-material';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import useStyles from './EnhancedSelectStyles';
import { CollectionName, CollectionType, CollectionElementString, collectionNameToElementString } from '../../../../types/CollectionTypes';

interface EnhancedSelectProps<T extends CollectionType[CollectionName]> {
  componentType: CollectionName;
  EnhancedComponent: React.ComponentType<any>;
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
}

function EnhancedSelect<T extends CollectionType[CollectionName]>({
  componentType,
  EnhancedComponent,
  selectedItems,
  onSelect,
  isInteractable,
  multiple = false,
  label,
  activeAccordion,
  onAccordionToggle,
  accordionEntityName,
  showCreateButton = false
}: EnhancedSelectProps<T>) {
  const classes = useStyles();
  const { selectFlexibleItem,selectCardItem } = useCardDialog();

  const accordionName = `select-${accordionEntityName}`;
  const isExpanded = activeAccordion === accordionName;

  const handleToggle = () => {
    onAccordionToggle(isExpanded ? null : accordionName);
  };

  const handleDelete = (itemToDelete: T) => {
    const updatedIds = selectedItems
      .filter(item => item._id !== itemToDelete._id)
      .map(item => item._id!);
    onSelect(updatedIds);
  };

  const collectionElementString = collectionNameToElementString[componentType] as CollectionElementString;

  const handleCreate = () => {
    selectFlexibleItem(collectionElementString, 'create');
  };

  const renderSelectedItem = (item: T) => (
    <Chip
      key={item._id}
      label={<EnhancedComponent mode="shortList" itemId={item._id} fetchAll={false} />}
      onDelete={multiple && isInteractable ? () => handleDelete(item) : undefined}
      onClick={() => selectCardItem(collectionElementString, item._id!)}
      className={classes.chip}
    />
  );

  return (
    <Box className={classes.selectContainer}>
      <Typography className={classes.label} variant="caption">{label}{multiple ? ' (multiple)' : null}</Typography>
      <Box className={classes.chipContainer}>
        {selectedItems?.map(renderSelectedItem)}
        <Box className={classes.buttonContainer}>
          <IconButton
            onClick={handleToggle}
            disabled={!isInteractable}
            size="small"
            className={classes.editButton}
          >
            {isExpanded ? <Close /> : <Edit />}
          </IconButton>
          {showCreateButton && (
            <IconButton
              onClick={handleCreate}
              disabled={!isInteractable}
              size="small"
              className={classes.createButton}
            >
              <Add />
            </IconButton>
          )}
        </Box>
      </Box>
      <Accordion expanded={isExpanded} onChange={handleToggle}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>{label}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <EnhancedComponent
            mode="shortList"
            fetchAll={true}
            onInteraction={(item: T) => {
              const newSelectedIds = multiple
                ? [...selectedItems.map(i => i._id!), item._id!]
                : [item._id!];
              onSelect(newSelectedIds);
            }}
            onView={(item: T) => selectCardItem(collectionElementString, item._id!)}
            isInteractable={isInteractable}
          />
        </AccordionDetails>
      </Accordion>
      <Divider className={classes.divider} />
    </Box>
  );
}

export default EnhancedSelect;