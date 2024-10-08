import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CustomMarkdown from '../markdown/CustomMarkdown';

const KnowledgebaseContent: React.FC = () => {
  const [content, setContent] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchContent = async () => {
      let path = location.pathname.split('/').pop() || 'index';
      const file_path = path !== 'knowledgebase' ? path : 'index';
      try {
        const response = await fetch(`/content/knowledgebase/${file_path}.md`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Failed to load markdown content:', error);
        setContent('# 404\nContent not found.');
      }
    };
    fetchContent();
  }, [location]);

  return <CustomMarkdown>{content}</CustomMarkdown>;
};

export default KnowledgebaseContent;