import {
  Chat as ChatIcon,
  PlayArrow as PlayArrowIcon,
  LibraryBooks as LibraryBooksIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  SvgIconComponent,
  Construction,
} from '@mui/icons-material';

export interface SiteSection {
  id: string;
  path: string;
  title: string;
  description?: string;
  icon: SvgIconComponent;
  navGroup?: 1 | 2 | 3;  // Used for header grouping
  showInDashboard?: boolean;  // Whether to show in dashboard grid
  dashboardSpan?: 1 | 2;  // Column span in dashboard grid
}

export const siteSections: Record<string, SiteSection> = {
  home: {
    id: 'home',
    path: '/',
    title: 'Home',
    icon: HomeIcon,
  },
  chat: {
    id: 'chat',
    path: '/chat-alice',
    title: 'Chat',
    description: 'Start a conversation or continue where you left off',
    icon: ChatIcon,
    navGroup: 1,
    showInDashboard: true,
    dashboardSpan: 2,
  },
  tasks: {
    id: 'tasks',
    path: '/start-task',
    title: 'Execute Tasks',
    description: 'Run and monitor your automated tasks',
    icon: PlayArrowIcon,
    navGroup: 1,
    showInDashboard: true,
    dashboardSpan: 2,
  },
  structures: {
    id: 'structures',
    path: '/structures',
    title: 'Create Structures',
    description: 'Build or edit your prompts, agents, tasks, chats, and more',
    icon: Construction,
    navGroup: 2,
    showInDashboard: true,
    dashboardSpan: 1,
  },
  references: {
    id: 'references',
    path: '/references',
    title: 'View References',
    description: 'Access your saved references and resources',
    icon: LibraryBooksIcon,
    navGroup: 2,
    showInDashboard: true,
    dashboardSpan: 1,
  },
  learn: {
    id: 'learn',
    path: '/shared/knowledgebase/',
    title: 'Learn',
    description: 'Explore the knowledge base and tutorials',
    icon: SchoolIcon,
    navGroup: 3,
    showInDashboard: true,
    dashboardSpan: 2,
  },
  settings: {
    id: 'settings',
    path: '/user-settings',
    title: 'User Settings',
    icon: SettingsIcon,
  },
};

// Helper function to get sections for dashboard
export const getDashboardSections = () =>
  Object.values(siteSections).filter(section => section.showInDashboard);

// Helper function to get sections by nav group
export const getSectionsByNavGroup = (group: 1 | 2 | 3) =>
  Object.values(siteSections).filter(section => section.navGroup === group);