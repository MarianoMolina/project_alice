import React, { useState, memo, useCallback, useMemo } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
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

export interface VerticalMenuSidebarProps<T extends string> {
  actions?: ActionConfig[];
  tabs: TabConfig<T>[];
  activeTab: T;
  onTabChange: (tabName: T) => void;
  renderContent?: (tabName: T) => React.ReactNode;
  expandedWidth: number;
  collapsedWidth: number;
  // New props for controlled expansion
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  defaultExpanded?: boolean;
}

// Existing components remain the same...
const ActionButton = memo(({ action }: { action: ActionConfig }) => (
  <Tooltip title={formatCamelCaseString(action.name)} placement="right">
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
));

const ActionsSection = memo(({ actions }: { actions: ActionConfig[] }) => {
  const classes = useStyles();
  
  return (
    <Box className={classes.actionsSection}>
      {actions.map((action) => (
        <ActionButton key={action.name} action={action} />
      ))}
    </Box>
  );
});

function TabButtonComponent<T extends string>({ 
  tab, 
  isActive, 
  onTabChange 
}: {
  tab: TabConfig<T>;
  isActive: boolean;
  onTabChange: (tabName: T) => void;
}) {
  return (
    <Tooltip title={formatCamelCaseString(tab.name)} placement="right">
      <span>
        <IconButton
          onClick={() => onTabChange(tab.name)}
          color={isActive ? 'primary' : 'default'}
          disabled={tab.disabled}
        >
          <tab.icon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
const TabButton = memo(TabButtonComponent) as typeof TabButtonComponent;

function TabGroupComponent<T extends string>({ 
  groupName, 
  groupTabs, 
  activeTab, 
  onTabChange, 
  groupIndex 
}: {
  groupName: string;
  groupTabs: TabConfig<T>[];
  activeTab: T;
  onTabChange: (tabName: T) => void;
  groupIndex: number;
}) {
  const classes = useStyles();
  
  return (
    <Box className={classes.tabGroup} style={{ backgroundColor: `var(--group-color-${groupIndex})` }}>
      {groupName !== 'ungrouped' && (
        <Typography variant="caption" className={classes.groupLabel}>
          {groupName}
        </Typography>
      )}
      {groupTabs.map((tab) => (
        <TabButton
          key={tab.name}
          tab={tab}
          isActive={activeTab === tab.name}
          onTabChange={onTabChange}
        />
      ))}
    </Box>
  );
}
const TabGroup = memo(TabGroupComponent) as typeof TabGroupComponent;

const ExpandButton = memo(({ 
  isExpanded, 
  onToggle 
}: {
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const classes = useStyles();
  
  return (
    <Box className={classes.expandButton}>
      <Tooltip title={isExpanded ? "Collapse" : "Expand"} placement="right">
        <IconButton onClick={onToggle}>
          {isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Tooltip>
    </Box>
  );
});

function VerticalMenuSidebar<T extends string>({
  actions,
  tabs,
  activeTab,
  onTabChange,
  renderContent,
  expandedWidth,
  collapsedWidth,
  // New controlled props with defaults
  expanded,
  onExpandedChange,
  defaultExpanded = true,
}: VerticalMenuSidebarProps<T>): React.ReactElement {
  const classes = useStyles();
  
  // Internal state for uncontrolled mode
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  
  // Determine if we're in controlled mode
  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;

  const handleTabChange = useCallback((tabName: T) => {
    onTabChange(tabName);
    if (renderContent) {
      if (isControlled && onExpandedChange) {
        onExpandedChange(true);
      } else {
        setInternalExpanded(true);
      }
    }
  }, [onTabChange, renderContent, isControlled, onExpandedChange]);

  const handleExpandToggle = useCallback(() => {
    const newValue = !isExpanded;
    if (isControlled && onExpandedChange) {
      onExpandedChange(newValue);
    } else {
      setInternalExpanded(newValue);
    }
  }, [isExpanded, isControlled, onExpandedChange]);

  const groupedTabs = useMemo(() => {
    return tabs.reduce((acc, tab) => {
      const group = tab.group || 'ungrouped';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(tab);
      return acc;
    }, {} as Record<string, TabConfig<T>[]>);
  }, [tabs]);

  const renderTabs = useCallback(() => {
    if (Object.keys(groupedTabs).length === 1 && groupedTabs.ungrouped) {
      return (
        <TabGroup
          groupName="ungrouped"
          groupTabs={groupedTabs.ungrouped}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          groupIndex={0}
        />
      );
    }

    return Object.entries(groupedTabs).map(([groupName, groupTabs], index) => (
      <TabGroup
        key={groupName}
        groupName={groupName}
        groupTabs={groupTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        groupIndex={index}
      />
    ));
  }, [groupedTabs, activeTab, handleTabChange]);

  return (
    <Box
      className={classes.sidebar}
      style={{ width: isExpanded ? expandedWidth : collapsedWidth }}
    >
      <Box className={classes.verticalMenu} style={{ width: collapsedWidth }}>
        {actions && actions.length > 0 && <ActionsSection actions={actions} />}
        <Box className={classes.tabsSection}>
          {renderTabs()}
        </Box>
        {renderContent && (
          <ExpandButton
            isExpanded={isExpanded}
            onToggle={handleExpandToggle}
          />
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

export default memo(VerticalMenuSidebar) as typeof VerticalMenuSidebar;