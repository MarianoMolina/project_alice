import React, { useMemo, useRef } from 'react';
import { TaskFormsProps } from '../../../../../types/TaskTypes';
import BasicAgentTask from './BasicAgentTask';
import { Box } from '@mui/material';
import EnhancedSelect from '../../../common/enhanced_select/EnhancedSelect';
import PromptShortListView from '../../../prompt/prompt/PromptShortListView';
import { Prompt } from '../../../../../types/PromptTypes';
import { useApi } from '../../../../../contexts/ApiContext';

const PromptAgentTask: React.FC<TaskFormsProps> = ({ item, onChange, mode, handleAccordionToggle, activeAccordion, handleSave, apis }) => {
  const { fetchItem } = useApi();
  const isEditMode = mode === 'edit' || mode === 'create';

  const itemRef = useRef(item);
  const onChangeRef = useRef(onChange);

  // Update refs when props change
  itemRef.current = item;
  onChangeRef.current = onChange;

  const memoizedPromptSelect = useMemo(() => (
    <EnhancedSelect<Prompt>
      componentType="prompts"
      EnhancedView={PromptShortListView}
      selectedItems={itemRef.current?.templates?.task_template ? [itemRef.current.templates.task_template] : []}
      onSelect={async (selectedIds: string[]) => {
        const currentItem = itemRef.current;
        if (currentItem) {
          if (selectedIds.length > 0) {
            const prompt = await fetchItem('prompts', selectedIds[0]) as Prompt;
            onChangeRef.current({
              ...currentItem,
              templates: { ...currentItem.templates, task_template: prompt },
            });
          } else {
            onChangeRef.current({
              ...currentItem,
              templates: { ...currentItem.templates, task_template: null },
            });
          }
        }
      }}
      isInteractable={isEditMode}
      label="Select Prompt"
      activeAccordion={activeAccordion}
      onAccordionToggle={handleAccordionToggle}
      accordionEntityName="prompts"
      showCreateButton={true}
    />
  ), [item?.templates, isEditMode, activeAccordion, handleAccordionToggle, fetchItem]);

  const memoizedBasicAgentTask = useMemo(() => (
    <BasicAgentTask
      apis={apis}
      handleSave={handleSave}
      items={null}
      item={itemRef.current}
      onChange={onChangeRef.current}
      mode={mode}
      handleAccordionToggle={handleAccordionToggle}
      activeAccordion={activeAccordion}
    />
  ), [apis, handleSave, mode, handleAccordionToggle, activeAccordion]);

  if (!item) {
    return <Box>No task data available.</Box>;
  }

  return (
    <Box>
      {memoizedBasicAgentTask}
      <Box>
        {memoizedPromptSelect}
      </Box>
    </Box>
  );
};

export default React.memo(PromptAgentTask);