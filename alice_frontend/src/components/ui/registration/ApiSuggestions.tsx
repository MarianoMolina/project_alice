import React, { useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import { ApiType, API } from '../../../utils/ApiTypes';
import { getAvailableApiTypes } from '../../../utils/ApiUtils';

interface ApiSuggestionsProps {
  intent: string;
  onSuggest: (apis: API[]) => void;
}

const ApiSuggestions: React.FC<ApiSuggestionsProps> = ({ intent, onSuggest }) => {
  useEffect(() => {
    const suggestedApis: API[] = [];
    const availableTypes = getAvailableApiTypes([]);

    const createApiObject = (type: ApiType): API => ({
      api_type: type,
      name: `${type} API`,
      is_active: false,
      health_status: 'unknown',
      api_config: {},
    });

    // Always suggest LLM API
    if (availableTypes.includes(ApiType.LLM_API)) {
      suggestedApis.push(createApiObject(ApiType.LLM_API));
    }

    // Suggest additional APIs based on intent
    switch (intent) {
      case 'research':
        if (availableTypes.includes(ApiType.WIKIPEDIA_SEARCH)) {
          suggestedApis.push(createApiObject(ApiType.WIKIPEDIA_SEARCH));
        }
        if (availableTypes.includes(ApiType.GOOGLE_SEARCH)) {
          suggestedApis.push(createApiObject(ApiType.GOOGLE_SEARCH));
        }
        break;
      case 'coding':
        if (availableTypes.includes(ApiType.ARXIV_SEARCH)) {
          suggestedApis.push(createApiObject(ApiType.ARXIV_SEARCH));
        }
        break;
      // Add more cases as needed
    }

    onSuggest(suggestedApis);
  }, [intent, onSuggest]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Suggested APIs for Your Use Case
      </Typography>
      <List>
        {getAvailableApiTypes([]).map((apiType: ApiType) => (
          <ListItem key={apiType}>
            <ListItemText primary={apiType} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ApiSuggestions;