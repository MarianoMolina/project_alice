import React, { useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { UserInteraction } from '../../../types/UserInteractionTypes';
import { CopyButton } from '../../ui/markdown/CopyButton';
import CustomMarkdown from '../../ui/markdown/CustomMarkdown';
import { useDialog } from '../../../contexts/DialogCustomContext';
import { useCardDialog } from '../../../contexts/CardDialogContext';
import { useApi } from '../../../contexts/ApiContext';
import Logger from '../../../utils/Logger';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const SectionLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
  fontWeight: 'bold',
}));

const Content = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const ViewButton = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(1),
}));

interface UserInteractionViewerProps {
  interaction: UserInteraction;
}

const UserInteractionViewer: React.FC<UserInteractionViewerProps> = ({ interaction: initialInteraction }) => {
  const [interaction, setInteraction] = useState(initialInteraction);
  const { openDialog } = useDialog();
  const { selectCardItem } = useCardDialog();
  const { updateUserInteraction } = useApi();

  const handleViewTaskResponse = () => {
    if (interaction.owner && interaction.owner.type === 'task_response') {
      selectCardItem('TaskResponse', interaction.owner.id as string);
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
            Logger.debug('User interaction updated:', updatedInteraction);
            setInteraction(updatedInteraction);
          } catch (error) {
            Logger.error('Error handling user response:', error);
          }
        },
        color: 'primary',
        variant: key === '0' ? 'contained' : 'outlined',
      })),
    });
  };

  // Safely access nested objects with default values
  const prompt = interaction.user_checkpoint_id?.user_prompt || 'No user prompt available';

  return (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">User Interaction</Typography>
        <Box>
          {!interaction.user_response && (
            <ViewButton
              variant="contained"
              size="small"
              startIcon={<QuestionAnswerIcon />}
              onClick={handleResponseClick}
            >
              Respond
            </ViewButton>
          )}
          {interaction.owner && interaction.owner.type === 'task_response' && (
            <ViewButton
              variant="outlined"
              size="small"
              onClick={handleViewTaskResponse}
            >
              View Task Response
            </ViewButton>
          )}
          <CopyButton code={JSON.stringify(interaction, null, 2)} />
        </Box>
      </Box>

      <Content>
        <SectionLabel variant="subtitle1">TASK:</SectionLabel>
        <Box display="flex" alignItems="center">
          <Typography variant="body1">
            {interaction.owner?.id || 'No task response available'}
          </Typography>
        </Box>
      </Content>

      <Content>
        <SectionLabel variant="subtitle1">USER PROMPT:</SectionLabel>
        <CustomMarkdown>{prompt}</CustomMarkdown>
      </Content>

      {interaction.user_response ? (
        <Content>
          <SectionLabel variant="subtitle1">USER RESPONSE:</SectionLabel>
          <Typography variant="body1">
            Selected Option: {interaction.user_response.selected_option}
          </Typography>
          {interaction.user_response.user_feedback && (
            <Box mt={1}>
              <Typography variant="body2">Feedback:</Typography>
              <CustomMarkdown>{interaction.user_response.user_feedback}</CustomMarkdown>
            </Box>
          )}
        </Content>
      ) : (
        <Content>
          <SectionLabel variant="subtitle1">USER RESPONSE:</SectionLabel>
          <Typography variant="body2" color="text.secondary">
            No response provided yet
          </Typography>
        </Content>
      )}
    </StyledPaper>
  );
};

export default UserInteractionViewer;