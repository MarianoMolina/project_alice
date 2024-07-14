import React from 'react';
import { List, ListItem, ListItemText, Typography, Link } from '@mui/material';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  metadata?: Record<string, any>;
}

interface SearchOutputProps {
  content: SearchResult[];
}

export const SearchOutput: React.FC<SearchOutputProps> = ({ content }) => {
  return (
    <List>
      {content.map((result, index) => (
        <ListItem key={index}>
          <ListItemText
            primary={<Link href={result.url} target="_blank" rel="noopener noreferrer">{result.title}</Link>}
            secondary={
              <>
                <Typography component="span" variant="body2" color="textPrimary">
                  {result.content}
                </Typography>
                {result.metadata && (
                  <Typography component="span" variant="caption" display="block">
                    Metadata: {JSON.stringify(result.metadata)}
                  </Typography>
                )}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};