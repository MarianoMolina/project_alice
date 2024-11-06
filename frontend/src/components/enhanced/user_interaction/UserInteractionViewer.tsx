import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { UserInteraction } from '../../../types/UserInteractionTypes';
import { CopyButton } from '../../ui/markdown/CopyButton';
import CustomMarkdown from '../../ui/markdown/CustomMarkdown';
import Logger from '../../../utils/Logger';
import { useCardDialog } from '../../../contexts/CardDialogContext';

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

const UserInteractionViewer: React.FC<UserInteractionViewerProps> = ({ interaction }) => {
  Logger.debug('UserInteractionViewer', interaction);
  const { selectCardItem } = useCardDialog();

  // Safely access nested objects with default values
  const prompt = interaction.user_checkpoint_id?.user_prompt || 'No user prompt available';

  const handleViewTaskResponse = () => {
    if (interaction.task_response_id) {
      selectCardItem('TaskResponse', interaction.task_response_id);
    }
  };

  return (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">User Interaction</Typography>
        <Box>
          {interaction.task_response_id && (
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
            {interaction.task_response_id || 'No task response available'}
          </Typography>
        </Box>
      </Content>

      <Content>
        <SectionLabel variant="subtitle1">USER PROMPT:</SectionLabel>
        <CustomMarkdown>{prompt}</CustomMarkdown>
      </Content>

      {interaction.user_response && (
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
      )}
    </StyledPaper>
  );
};

export default UserInteractionViewer;