import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TaskType } from '../../../../types/TaskTypes';
import { BentoGrid, BentoGridItem } from '../../../ui/aceternity/BentoGrid';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../utils/cn';
import { taskDescriptions } from '../../../../utils/TaskUtilts';


interface TaskCapabilitiesProps {
  taskType?: TaskType;
}

const TaskCapabilities: React.FC<TaskCapabilitiesProps> = ({
  taskType,
}) => {
  const navigate = useNavigate();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [currentTaskType, setCurrentTaskType] = useState<TaskType | undefined>(taskType);

  // Reset states when dialog closes or opens with a specific task
  useEffect(() => {
    if (taskType) {
      setCurrentTaskType(taskType);
      setExpandedTasks(new Set([taskType]));
    }
  }, [taskType]);

  const toggleTaskExpansion = (task: TaskType) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(task)) {
      newExpanded.delete(task);
      setCurrentTaskType(undefined);
    } else {
      newExpanded.add(task);
      setCurrentTaskType(task);
    }
    setExpandedTasks(newExpanded);
  };

  const filteredTasks = currentTaskType
    ? [currentTaskType]
    : Object.keys(taskDescriptions) as TaskType[];

  const itemClass = cn(
    currentTaskType ? 'md:col-span-4' : 'md:col-span-2'
  );

  return (
    <>
      {/* Explanation Section */}
      <Box className="mb-6 space-y-4">
        <Typography variant="body1">
          Project Alice organizes operations into distinct task types. Each task type is designed for specific use cases and provides built-in functionality.
        </Typography>

        <Alert severity="info" className="mb-4">
          <Typography variant="body2">
            <strong>Key Points:</strong>
            <ul className="list-disc pl-4 mt-2">
              <li>Tasks can be used independently or combined in workflows</li>
              <li>Each task type provides specialized functionality and error handling</li>
              <li>Tasks can be customized through their configuration forms</li>
              <li>Click a task's configuration button to view its default setup</li>
            </ul>
          </Typography>
        </Alert>
      </Box>

      {/* Task Grid */}
      <BentoGrid className="w-full">
        {filteredTasks.map((task) => {
          const taskInfo = taskDescriptions[task];
          const isExpanded = expandedTasks.has(task);

          return (
            <BentoGridItem
              key={task}
              title={task}
              header={
                <Box className="flex items-center gap-2">
                  {taskInfo.icon}
                  <Typography variant="subtitle2" className="text-neutral-200">
                    {currentTaskType === task ? 'Less details' : 'More details'}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => toggleTaskExpansion(task)}
                    className="text-neutral-200 hover:text-white"
                  >
                    <ExpandMoreIcon
                      className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''
                        }`}
                    />
                  </IconButton>
                </Box>
              }
              description={
                <Box className="space-y-4">
                  <AliceMarkdown>{taskInfo.description}</AliceMarkdown>
                  {isExpanded && (
                    <Box className="mt-4">
                      <Typography variant="body1" className="mb-2 text-neutral-300">
                        Default Configuration:
                      </Typography>
                      <CodeBlock
                        code={JSON.stringify(taskInfo.default_form, null, 2)}
                        language="json"
                      />
                    </Box>
                  )}
                  {taskInfo.detail_knowledgebase_link && (
                    <Box className="mt-2">
                      <Typography
                        variant="body2"
                        className="text-blue-400 hover:text-blue-300 cursor-pointer"
                        onClick={() => {
                          // Remove 'shared/', leading slash, and .md extension
                          const path = taskInfo.detail_knowledgebase_link
                            ?.replace(/^\/?(shared\/)?/, '')  // Remove leading slash and optional shared/
                            .replace(/\.md$/, '');            // Remove .md extension
                          navigate(`/shared/${path}`);
                        }}
                      >
                        View Documentation →
                      </Typography>
                    </Box>
                  )}
                </Box>
              }
              className={itemClass}
              background="bg-slate-900"
              textColor="text-neutral-200"
            />
          );
        })}
      </BentoGrid>
    </>
  );
};

export default TaskCapabilities;