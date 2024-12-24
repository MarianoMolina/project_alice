import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CustomMarkdown from '../markdown/CustomMarkdown';
import Logger from '../../../utils/Logger';

// Helper function to normalize paths
const normalizePath = (path: string): string => {
  // Remove .md extension if present
  let normalizedPath = path.replace(/\.md$/, '');
  
  // Handle the case where we just have 'knowledgebase' or 'knowledgebase/'
  if (normalizedPath === 'knowledgebase' || normalizedPath === 'knowledgebase/') {
    normalizedPath = 'knowledgebase/index';
  }
  
  return normalizedPath;
};

// Custom transformer for markdown content
const transformMarkdownLinks = (content: string): string => {
  // Replace markdown links that include .md with links without .md
  return content.replace(/\[([^\]]+)\]\(([^)]+)\.md\)/g, (_, text, path) => {
    return `[${text}](${path})`;
  });
};

const KnowledgebaseContent: React.FC = () => {
  const [content, setContent] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Get everything after 'shared/'
        const path = location.pathname.split('/shared/')[1] || 'knowledgebase/index';
        const normalizedPath = normalizePath(path);
        
        Logger.debug(`Fetching content for path: ${normalizedPath}`);
        
        // Always append .md when fetching the file
        const response = await fetch(`/shared/${normalizedPath}.md`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }
        
        const text = await response.text();
        // Transform the content to handle .md links
        const transformedContent = transformMarkdownLinks(text);
        setContent(transformedContent);
        
      } catch (error) {
        Logger.error('Failed to load markdown content:', error);
        setContent(`# 404\nContent not found: ${location.pathname}`);
      }
    };

    fetchContent();
  }, [location]);

  return <CustomMarkdown>{content}</CustomMarkdown>;
};

export default KnowledgebaseContent;