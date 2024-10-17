import React from 'react';
import { Card, CardContent, Typography, IconButton, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { UserInteraction, UserResponse } from '../../../types/UserInteractionTypes';
import { useDialog } from '../../../contexts/DialogCustomContext';

interface UserInteractionHandlerProps {
  userInteraction: UserInteraction;
  onUserResponse: (response: UserResponse) => void;
}

const UserInteractionHandler: React.FC<UserInteractionHandlerProps> = ({ userInteraction, onUserResponse }) => {
  const { openDialog } = useDialog();

  const handleUserInteraction = () => {
    openDialog({
      title: 'User Interaction Required',
      content: userInteraction.user_prompt,
      buttons: Object.entries(userInteraction.options_obj).map(([key, value]) => ({
        text: value,
        action: () => {
          const response: UserResponse = {
            selected_option: parseInt(key),
          };
          onUserResponse(response);
        },
        color: 'primary',
        variant: key === '0' ? 'contained' : 'outlined',
      })),
    });
  };

  const truncatePrompt = (prompt: string, maxLength: number = 50) => {
    return prompt.length > maxLength ? `${prompt.substring(0, maxLength)}...` : prompt;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Card sx={{ width: 200, height: 50, display: 'flex', alignItems: 'center', mb: 1 }}>
      <CardContent sx={{ flex: 1, p: 1, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" noWrap>
              {truncatePrompt(userInteraction.user_prompt)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(userInteraction.createdAt)}
            </Typography>
          </Box>
          {userInteraction.user_response ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : (
            <IconButton size="small" onClick={handleUserInteraction}>
              <QuestionAnswerIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserInteractionHandler;