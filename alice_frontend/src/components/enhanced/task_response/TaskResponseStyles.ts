import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  rootLog: {
    backgroundColor: '#000',
    color: '#00ff00',
    fontFamily: 'monospace',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  lineLog: {
    margin: 0,
    lineHeight: 1.5,
  },
  workflowContainer: {
    border: `1px solid ${theme.palette.divider}`,
    width: '100%',
  },
  taskResponseContainer: {
    marginBottom: theme.spacing(2),
  },
  workflowAccordion: {
    '&:before': {
      display: 'none',
    },
    boxShadow: 'none',
    '& .MuiAccordionSummary-root': {
      minHeight: '48px',
      '&.Mui-expanded': {
        minHeight: '48px',
      },
    },
    '& .MuiAccordionSummary-content': {
      margin: '12px 0',
      '&.Mui-expanded': {
        margin: '12px 0',
      },
    },
  },

  searchResultCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    transition: 'box-shadow 0.3s ease-in-out',
    '&:hover': {
      boxShadow: theme.shadows[3],
    },
  },
  searchResultContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionLabel: {
    fontWeight: 'bold',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  },
  searchResultTitle: {
    marginBottom: theme.spacing(1),
  },
  searchResultUrl: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    wordBreak: 'break-all',
  },
  searchResultBody: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  searchResultMetadata: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
  metadataChip: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
  outputInterfaceList: {
    overflowX: 'auto',
  }
}));

export default useStyles;