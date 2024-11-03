import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CustomMarkdown from '../markdown/CustomMarkdown';
import Logger from '../../../utils/Logger';

const KnowledgebaseContent: React.FC = () => {
  const [content, setContent] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Get everything after 'knowledgebase'
        const path = location.pathname.split('/knowledgebase/')[1] || 'general/index';
        
        Logger.info(`Fetching content for path: ${path}`);
        
        const response = await fetch(`/content/knowledgebase/${path}.md`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
        
      } catch (error) {
        console.error('Failed to load markdown content:', error);
        setContent(`# 404\nContent not found: ${location.pathname}`);
      }
    };

    fetchContent();
  }, [location]);

  return <CustomMarkdown>{content}</CustomMarkdown>;
};

export default KnowledgebaseContent;