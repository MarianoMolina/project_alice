import React from 'react';
import { Box, IconButton, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import { Edit, Close, ExpandMore, Delete } from '@mui/icons-material';
import { CollectionName, CollectionType } from '../../../../utils/CollectionTypes';

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
  onView: (id: string) => void;
  accordionEntityName: string;
}

function EnhancedSelect<T extends CollectionType[CollectionName]>({
  EnhancedComponent,
  selectedItems,
  onSelect,
  isInteractable,
  multiple = false,
  label,
  activeAccordion,
  onAccordionToggle,
  onView,
  accordionEntityName
}: EnhancedSelectProps<T>) {
  const accordionName = `select-${accordionEntityName}`;
  const isExpanded = activeAccordion === accordionName;

  const handleToggle = () => {
    onAccordionToggle(isExpanded ? null : accordionName);
  };
  console.log('selectedItems', selectedItems);
  console.log()

  const handleDelete = (itemToDelete: T) => {
    const updatedIds = selectedItems
      .filter(item => item._id !== itemToDelete._id)
      .map(item => item._id!);
    onSelect(updatedIds);
  };

  return (
    <Box>
      {selectedItems?.map(item => (
        <Box key={item._id} display="flex" alignItems="center">
          <EnhancedComponent
            mode="shortList"
            itemId={item._id}
            fetchAll={false}
            onView={() => onView(item._id!)}
          />
          {multiple && isInteractable && (
            <IconButton onClick={() => handleDelete(item)} size="small">
              <Delete />
            </IconButton>
          )}
        </Box>
      ))}
      <IconButton onClick={handleToggle} disabled={!isInteractable}>
        {isExpanded ? <Close /> : <Edit />}
      </IconButton>
      <Accordion expanded={isExpanded} onChange={handleToggle}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>{label}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <EnhancedComponent
            mode="list"
            fetchAll={true}
            onInteraction={(item: T) => {
              const newSelectedIds = multiple
                ? [...selectedItems.map(i => i._id!), item._id!]
                : [item._id!];
              onSelect(newSelectedIds);
            }}
            onView={(item: T) => onView(item._id!)}
            isInteractable={isInteractable}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default EnhancedSelect;