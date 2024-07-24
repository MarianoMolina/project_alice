import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Divider } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';
import useStyles from './VerticalMenuSidebarStyles';

interface ActionConfig {
  name: string;
  icon: SvgIconComponent;
  action: () => void;
  disabled?: boolean;
}

interface TabConfig {
  name: string;
  icon: SvgIconComponent;
  disabled?: boolean;
}

interface VerticalMenuSidebarProps {
  actions?: ActionConfig[];
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabName: string) => void;
  renderContent?: (tabName: string) => React.ReactNode;
  expandedWidth: number;
  collapsedWidth: number;
}

const VerticalMenuSidebar: React.FC<VerticalMenuSidebarProps> = ({
  actions,
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
    onTabChange(tabName);
    if (renderContent) {
      setIsExpanded(true);
    }
  };

  return (
    <Box
      className={classes.sidebar}
      style={{ width: isExpanded ? expandedWidth : collapsedWidth }}
    >
      <Box className={classes.verticalMenu} style={{ width: collapsedWidth }}>
        {actions && actions.length > 0 && (
          <>
            <Box className={classes.actionsSection}>
              {actions.map((action) => (
                <Tooltip key={action.name} title={action.name} placement="right">
                  <span>
                    <IconButton
                      onClick={action.action}
                      color="primary"
                      disabled={action.disabled}
                    >
                      <action.icon />
                    </IconButton>
                  </span>
                </Tooltip>
              ))}
            </Box>
            <Divider className={classes.divider} />
          </>
        )}
        <Box className={classes.tabsSection}>
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
        </Box>
        {renderContent && (
          <Box className={classes.expandButton}>
            <Tooltip title={isExpanded ? "Collapse" : "Expand"} placement="right">
              <IconButton onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronLeft /> : <ChevronRight />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      {isExpanded && renderContent && (
        <Box className={classes.content}>
          {renderContent(activeTab)}
        </Box>
      )}
    </Box>
  );
};

export default VerticalMenuSidebar;