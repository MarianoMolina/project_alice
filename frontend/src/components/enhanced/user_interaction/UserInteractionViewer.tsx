import React from 'react';
import { Box, Typography, Paper, Chip, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { UserInteraction } from '../../../types/UserInteractionTypes';
import { CopyButton } from '../../ui/markdown/CopyButton';
import CustomMarkdown from '../../ui/markdown/CustomMarkdown';

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

const OptionChip = styled(Chip)<{ selected?: boolean }>(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: selected ? theme.palette.primary.main : undefined,
  color: selected ? theme.palette.primary.contrastText : undefined,
}));

interface UserInteractionViewerProps {
  interaction: UserInteraction;
}

const UserInteractionViewer: React.FC<UserInteractionViewerProps> = ({ interaction }) => {
  return (
    <StyledPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">User Interaction</Typography>
        <CopyButton code={JSON.stringify(interaction, null, 2)} />
      </Box>

      <Content>
        <SectionLabel variant="subtitle1">PROMPT:</SectionLabel>
        <CustomMarkdown>{interaction.user_prompt}</CustomMarkdown>
      </Content>

      <Content>
        <SectionLabel variant="subtitle1">OPTIONS:</SectionLabel>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {Object.entries(interaction.options_obj).map(([index, option]) => (
            <OptionChip
              key={index}
              label={`${index}: ${option}`}
              selected={interaction.user_response?.selected_option === Number(index)}
            />
          ))}
        </Stack>
      </Content>

      {interaction.user_response && (
        <Content>
          <SectionLabel variant="subtitle1">USER RESPONSE:</SectionLabel>
          <Typography variant="body1">Selected Option: {interaction.user_response.selected_option}</Typography>
          {interaction.user_response.user_feedback && (
            <Box mt={1}>
              <Typography variant="body2">Feedback:</Typography>
              <CustomMarkdown>{interaction.user_response.user_feedback}</CustomMarkdown>
            </Box>
          )}
        </Content>
      )}

      {Object.keys(interaction.task_next_obj).length > 0 && (
        <Content>
          <SectionLabel variant="subtitle1">NEXT TASKS:</SectionLabel>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {Object.entries(interaction.task_next_obj).map(([index, task]) => (
              <Chip
                key={index}
                label={`${index}: ${task}`}
                variant="outlined"
                color="primary"
              />
            ))}
          </Stack>
        </Content>
      )}

      {Object.keys(interaction.execution_history).length > 0 && (
        <Content>
          <SectionLabel variant="subtitle1">EXECUTION HISTORY:</SectionLabel>
          <CustomMarkdown>
            {JSON.stringify(interaction.execution_history, null, 2)}
          </CustomMarkdown>
        </Content>
      )}
    </StyledPaper>
  );
};

export default UserInteractionViewer;