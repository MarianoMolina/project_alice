import React from 'react';
import { IconButton, Tooltip, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { SiteSection } from '../../../utils/SectionIcons';

interface NavigationButtonProps {
  section: SiteSection;
  isMobile?: boolean;
  onClick: (path: string) => void;
  className?: string;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  section,
  isMobile = false,
  onClick,
  className = ''
}) => {
  const location = useLocation();
  
  const isActive = (path: string): boolean => {
    if (path.endsWith('/')) {
      return location.pathname.startsWith(path);
    }
    return location.pathname === path;
  };

  if (isMobile) {
    return (
      <ListItem 
        button
        onClick={() => onClick(section.path)}
        selected={isActive(section.path)}
      >
        <ListItemIcon>
          <section.icon />
        </ListItemIcon>
        <ListItemText primary={section.title} />
      </ListItem>
    );
  }

  return (
    <Tooltip title={section.title}>
      <IconButton
        color="inherit"
        onClick={() => onClick(section.path)}
        className={`${isActive(section.path) ? 'active' : ''} ${className}`}
      >
        <section.icon />
      </IconButton>
    </Tooltip>
  );
};
