import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import {
  QuestionAnswer as QuestionAnswerIcon,
  Launch as LaunchIcon,
  CheckCircle as CheckIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import { UserInteractionComponentProps } from '../../../../types/UserInteractionTypes';
import CustomMarkdown from '../../../ui/markdown/CustomMarkdown';
import { useDialog } from '../../../../contexts/DialogCustomContext';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import { useApi } from '../../../../contexts/ApiContext';
import Logger from '../../../../utils/Logger';

const UserInteractionViewer: React.FC<UserInteractionComponentProps> = ({ item }) => {
  const [interaction, setInteraction] = useState(item);
  const { openDialog } = useDialog();
  const { selectCardItem } = useCardDialog();
  const { updateUserInteraction } = useApi();

  if (!interaction) return null;

  const handleViewOwner = () => {
    if (interaction.owner?.id) {
      selectCardItem(
        interaction.owner.type === 'task_response' ? 'TaskResponse' : 'Chat',
        interaction.owner.id
      );
    }
  };

  const handleResponseClick = () => {
    openDialog({
      title: 'User Interaction Required',
      content: interaction.user_checkpoint_id.user_prompt,
      buttons: Object.entries(interaction.user_checkpoint_id.options_obj).map(([key, value]) => ({
        text: value,
        action: async () => {
          try {
            const updatedInteraction = await updateUserInteraction(
              interaction._id as string,
              {
                user_response: {
                  selected_option: parseInt(key),
                }
              }
            );
            setInteraction(updatedInteraction);
            Logger.debug('User interaction updated:', updatedInteraction);
          } catch (error) {
            Logger.error('Error handling user response:', error);
          }
        },
        color: 'primary',
        variant: key === '0' ? 'contained' : 'outlined',
      })),
    });
  };

  const ownerType = interaction.owner?.type === 'task_response' ? 'Task Response' : 'Chat';

  return (
    <Paper className="relative overflow-hidden">
      <Box className="p-4">
        <Stack spacing={3}>
          {/* Header */}
          <Box className="flex items-start justify-between">
            <Stack spacing={1}>
              <Box className="flex items-center gap-2">
                <QuestionAnswerIcon className="text-gray-600" />
                <Typography variant="h6" className="font-semibold">
                  User Interaction
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={interaction.user_response ? <CheckIcon /> : <PendingIcon />}
                  label={interaction.user_response ? 'Responded' : 'Pending Response'}
                  size="small"
                  className={interaction.user_response ? 
                    "bg-green-100 text-green-700" : 
                    "bg-yellow-100 text-yellow-700"
                  }
                />
                {interaction.owner && (
                  <Chip
                    label={`From ${ownerType}`}
                    size="small"
                    className="bg-gray-100"
                  />
                )}
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1}>
              {!interaction.user_response && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleResponseClick}
                  startIcon={<QuestionAnswerIcon />}
                  className="bg-blue-600"
                >
                  Respond
                </Button>
              )}
              {interaction.owner && (
                <Tooltip title={`View ${ownerType}`}>
                  <IconButton
                    onClick={handleViewOwner}
                    size="small"
                    className="text-gray-600"
                  >
                    <LaunchIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>

          {/* Prompt */}
          <Box>
            <Typography variant="subtitle2" className="text-gray-600 mb-2">
              Prompt
            </Typography>
            <Box className="rounded p-3">
              <CustomMarkdown>
                {interaction.user_checkpoint_id?.user_prompt || 'No prompt available'}
              </CustomMarkdown>
            </Box>
          </Box>

          {/* Response */}
          {interaction.user_response ? (
            <Box>
              <Typography variant="subtitle2" className="text-gray-600 mb-2">
                Response
              </Typography>
              <Box className="bg-gray-50 rounded p-3">
                <Typography variant="body2">
                  Selected Option: {interaction.user_response.selected_option}
                </Typography>
                {interaction.user_response.user_feedback && (
                  <Box className="mt-2 pt-2 border-t border-gray-200">
                    <Typography variant="subtitle2" className="text-gray-600 mb-1">
                      Feedback
                    </Typography>
                    <CustomMarkdown>
                      {interaction.user_response.user_feedback}
                    </CustomMarkdown>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle2" className="text-gray-600 mb-2">
                Response
              </Typography>
              <Box className="rounded p-3">
                <Typography variant="body2" className="text-gray-500 italic">
                  Awaiting response...
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default UserInteractionViewer;