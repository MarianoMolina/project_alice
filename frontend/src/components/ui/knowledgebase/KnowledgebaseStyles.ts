// KnowledgebaseStyles.ts
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

export type DepthClass = 'depth0' | 'depth1' | 'depth2';

export type StyleClasses = 'nav' | 'section' | 'sectionTitle' | 'accordion' | 
  'accordionSummary' | 'accordionDetails' | 'listItem' | DepthClass | 'nestedList' |
  'hierarchyContainer' | 'mainAccordion' | 'title';

const useStyles = makeStyles((theme: Theme) => ({
  nav: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    overflow: 'auto',
  },
  section: {
    marginBottom: theme.spacing(1),
  },
  mainAccordion: {
    '&:before': {
      display: 'none',
    },
    boxShadow: 'none',
    backgroundColor: 'transparent',
    '& .MuiAccordionSummary-root': {
      minHeight: '32px !important',
    },
    '&.Mui-expanded': {
      margin: '0 !important',
    },
  },
  sectionTitle: {
    fontWeight: 700,
    color: theme.palette.primary.main,
    fontSize: '1rem',
  },
  accordion: {
    '&:before': {
      display: 'none',
    },
    boxShadow: 'none',
    backgroundColor: 'transparent',
    '&.Mui-expanded': {
      margin: 0,
    },
  },
  accordionSummary: {
    minHeight: 32,
    padding: theme.spacing(0, 1),
    '&.Mui-expanded': {
      minHeight: 32,
    },
    '& .MuiAccordionSummary-content': {
      margin: '0 !important',
    },
  },
  accordionDetails: {
    padding: 0,
    position: 'relative',
  },
  hierarchyContainer: {
    position: 'relative',
    paddingLeft: theme.spacing(2),
    '&:before': {
      content: '""',
      position: 'absolute',
      left: theme.spacing(0.75),
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: theme.palette.divider,
    },
  },
  listItem: {
    padding: `${theme.spacing(0.25, 2)} !important`,
    position: 'relative',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.primary.main,
    },
    '&.active': {
      backgroundColor: theme.palette.primary.main + '15',
      color: theme.palette.primary.main,
      borderRadius: theme.shape.borderRadius,
      '& .MuiTypography-root': {
        fontWeight: 700,
      },
    },
  },
  title: {
    '& .MuiTypography-root': {
      color: theme.palette.text.primary,
      fontWeight: 600,
    },
    '&.active': {
      backgroundColor: theme.palette.secondary.main + '15',
      color: theme.palette.secondary.main,
      '& .MuiTypography-root': {
        color: theme.palette.secondary.main,
        fontWeight: 700,
      },
    },
  },
  depth0: {
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  depth1: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  depth2: {
    fontSize: '0.8125rem',
    fontWeight: 400,
  },
  nestedList: {
    position: 'relative',
  },
}));

export default useStyles;