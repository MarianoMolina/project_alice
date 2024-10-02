import React from 'react';
import { TaskFormsProps } from '../../../../../types/TaskTypes';
import BasicAgentTask from './BasicAgentTask';
import { Box } from '@mui/material';
import EnhancedSelect from '../../../common/enhanced_select/EnhancedSelect';
import EnhancedPrompt from '../../../prompt/prompt/EnhancedPrompt';
import { Prompt } from '../../../../../types/PromptTypes';
import { useApi } from '../../../../../contexts/ApiContext';

const PromptAgentTask: React.FC<TaskFormsProps> = ({ item, onChange, mode, handleAccordionToggle, activeAccordion, handleSave, apis }) => {
  const { fetchItem } = useApi();
  const isEditMode = mode === 'edit' || mode === 'create';

  if (!item) {
    return <Box>No task data available.</Box>;
  }

  const handleTemplateChange = async (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      const prompt = await fetchItem('prompts', selectedIds[0]) as Prompt;
      onChange({
        ...item,
        templates: { ...item.templates, task_template: prompt },
      });
    } else {
      onChange({
        ...item,
        templates: { ...item.templates, task_template: null },
      });
    }
  };

  return (
    <Box>
      <BasicAgentTask
        apis={apis}
        handleSave={handleSave}
        items={null}
        item={item}
        onChange={onChange}
        mode={mode}
        handleAccordionToggle={handleAccordionToggle}
        activeAccordion={activeAccordion}
      />
      <Box>
        <EnhancedSelect<Prompt>
          componentType="prompts"
          EnhancedComponent={EnhancedPrompt}
          selectedItems={item.templates?.task_template ? [item.templates.task_template!] : []}
          onSelect={handleTemplateChange}
          isInteractable={isEditMode}
          label="Select Prompt"
          activeAccordion={activeAccordion}
          onAccordionToggle={handleAccordionToggle}
          accordionEntityName="prompts"
          showCreateButton={true}
        />
      </Box>
    </Box>
  );
};

export default PromptAgentTask;