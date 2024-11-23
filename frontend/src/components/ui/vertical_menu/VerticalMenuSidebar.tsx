import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Divider, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';
import useStyles from './VerticalMenuSidebarStyles';
import { formatCamelCaseString } from '../../../utils/StyleUtils';

interface ActionConfig {
  name: string;
  icon: SvgIconComponent;
  action: () => void;
  disabled?: boolean;
}

interface TabConfig<T> {
  name: T;
  icon: SvgIconComponent;
  disabled?: boolean;
  group?: string;
}

interface VerticalMenuSidebarProps<T extends string> {
  actions?: ActionConfig[];
  tabs: TabConfig<T>[];
  activeTab: T;
  onTabChange: (tabName: T) => void;
  renderContent?: (tabName: T) => React.ReactNode;
  expandedWidth: number;
  collapsedWidth: number;
}

function VerticalMenuSidebar<T extends string>({
  actions,
  tabs,
  activeTab,
  onTabChange,
  renderContent,
  expandedWidth,
  collapsedWidth,
}: VerticalMenuSidebarProps<T>): React.ReactElement {
  const classes = useStyles();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTabChange = (tabName: T) => {
    onTabChange(tabName);
    if (renderContent) {
      setIsExpanded(true);
    }
  };

  const groupedTabs = tabs.reduce((acc, tab) => {
    const group = tab.group || 'ungrouped';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(tab);
    return acc;
  }, {} as Record<string, TabConfig<T>[]>);

  const renderTabs = () => {
    if (Object.keys(groupedTabs).length === 1 && groupedTabs.ungrouped) {
      // If there's only one group and it's ungrouped, render tabs as before
      return groupedTabs.ungrouped.map((tab) => (
        <Tooltip key={tab.name} title={formatCamelCaseString(tab.name)} placement="right">
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
      ));
    } else {
      // Render grouped tabs
      return Object.entries(groupedTabs).map(([groupName, groupTabs], index) => (
        <Box key={groupName} className={classes.tabGroup} style={{ backgroundColor: `var(--group-color-${index})` }}>
          {groupName !== 'ungrouped' && (
            <Typography variant="caption" className={classes.groupLabel}>
              {groupName}
            </Typography>
          )}
          {groupTabs.map((tab) => (
            <Tooltip key={tab.name} title={formatCamelCaseString(tab.name)} placement="right">
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
      ));
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
                <Tooltip key={action.name} title={formatCamelCaseString(action.name)} placement="right">
                  <span>
                    <IconButton
                      onClick={action.action}
                      color="default"
                      disabled={action.disabled}
                    >
                      <action.icon />
                    </IconButton>
                  </span>
                </Tooltip>
              ))}
            </Box>
          </>
        )}
        <Box className={classes.tabsSection}>
          {renderTabs()}
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
}

export default VerticalMenuSidebar;