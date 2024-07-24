import React from 'react';
import { Box } from '@mui/material';
import PromptAgentTask from './PromptAgentTask';
import { TaskFormsProps } from '../../../../../utils/TaskTypes';

const CodeGenerationLLMTask: React.FC<TaskFormsProps> = ({
  item, onChange, mode, handleAccordionToggle, handleViewDetails, activeAccordion, handleSave, apis
}) => {

  return (
    <Box>
      <PromptAgentTask
        apis={apis}
        items={null}
        handleSave={handleSave}
        item={item}
        onChange={onChange}
        mode={mode}
        handleAccordionToggle={handleAccordionToggle}
        handleViewDetails={handleViewDetails}
        activeAccordion={activeAccordion}
      />
    </Box>
  );
};

export default CodeGenerationLLMTask;