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
        Logger.info(`Fetching content for path: ${location.pathname}`);
        const path = location.pathname.split('/shared/')[1] || 'knowledgebase/index';

        let new_ath = (path === "knowledgebase" || path === "knowledgebase/")? "knowledgebase/index" : path;
        
        Logger.info(`Fetching content for path: ${new_ath}`);
        
        const response = await fetch(`/shared/${new_ath}.md`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
        
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