import React from 'react';
import { Box, List, ListItem, Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TaskResponse } from '../../../types/TaskResponseTypes';
import { StringOutput } from './StringOutput';
import { LLMChatOutput } from './LLMChatOutput';
import { SearchOutput } from './SearchOutput';
import useStyles from './TaskResponseStyles';

interface WorkflowOutputProps {
  content: TaskResponse | TaskResponse[];
  depth?: number;
}

const AccordionSection: React.FC<{
  title: string;
  content: React.ReactNode;
  depth: number;
}> = ({ title, content, depth }) => {
  const classes = useStyles();

  return (
    <Accordion defaultExpanded={depth === 0} className={classes.workflowAccordion}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel-content-${title}`}
        id={`panel-header-${title}`}
      >
        <Typography variant="subtitle1">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{content}</AccordionDetails>
    </Accordion>
  );
};

export const WorkflowOutput: React.FC<WorkflowOutputProps> = ({ content, depth = 0 }) => {
  const classes = useStyles();
  console.log('WorkflowOutput content:', content);

  const renderContent = (item: any) => {
    if (!item || typeof item !== 'object') {
      return <Typography>No output content available</Typography>;
    }

    return (
      <List>
        {item.content.map((subItem: any, index: number) => (
          <ListItem key={index}>
            {(() => {
              switch (item.output_type) {
                case 'StringOutput':
                  return <StringOutput content={subItem} />;
                case 'LLMChatOutput':
                  return <LLMChatOutput message={subItem} />;
                case 'SearchOutput':
                  return <SearchOutput result={subItem} />;
                case 'WorkflowOutput':
                  return <WorkflowOutput content={subItem} depth={depth + 1} />;
                default:
                  return <Typography>Unknown output type: {item.output_type}</Typography>;
              }
            })()}
          </ListItem>
        ))}
      </List>
    );
  };

  const renderTaskResponse = (taskResponse: TaskResponse) => (
    <Box className={classes.taskResponseContainer}>
      <Typography variant="body2">{taskResponse.task_description}</Typography>
      {taskResponse.task_content && renderContent(taskResponse.task_content)}
    </Box>
  );

  const content_to_render = Array.isArray(content) ? content : [content];

  return (
    <Paper 
      elevation={depth} 
      className={classes.workflowContainer}
      style={{ marginLeft: `${depth * 16}px` }}
    >
      {content_to_render.map((taskResponse, index) => (
        <AccordionSection
          key={index}
          title={taskResponse.task_name}
          content={renderTaskResponse(taskResponse)}
          depth={depth}
        />
      ))}
    </Paper>
  );
};