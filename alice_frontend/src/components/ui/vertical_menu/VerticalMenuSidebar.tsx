import React, { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';
import useStyles from './VerticalMenuSidebarStyles';

interface TabConfig {
  name: string;
  icon: SvgIconComponent;
  disabled?: boolean;
}

interface VerticalMenuSidebarProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabName: string) => void;
  renderContent: (tabName: string) => React.ReactNode;
  expandedWidth: number;
  collapsedWidth: number;
}

const VerticalMenuSidebar: React.FC<VerticalMenuSidebarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  renderContent,
  expandedWidth,
  collapsedWidth,
}) => {
  const classes = useStyles();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTabChange = (tabName: string) => {
    if (tabName === activeTab) {
      setIsExpanded(!isExpanded);
    } else {
      onTabChange(tabName);
      setIsExpanded(true);
    }
  };

  return (
    <Box 
      className={classes.sidebar}
      style={{ width: isExpanded ? expandedWidth : collapsedWidth }}
    >
      <Box className={classes.verticalMenu}>
        {tabs.map((tab) => (
          <Tooltip key={tab.name} title={tab.name} placement="right">
            <span>
              <IconButton
                onClick={() => handleTabChange(tab.name)}
                color={activeTab === tab.name ? 'primary' : 'default'}
                disabled={tab.disabled}
              >
                <tab.icon />
              </IconButton>
            </span>
          </Tooltip>
        ))}
        <Box className={classes.expandButton}>
          <Tooltip title={isExpanded ? "Collapse" : "Expand"} placement="right">
            <IconButton onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {isExpanded && (
        <Box className={classes.content}>
          {renderContent(activeTab)}
        </Box>
      )}
    </Box>
  );
};

export default VerticalMenuSidebar;