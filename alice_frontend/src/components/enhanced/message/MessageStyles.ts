import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  message: {
    marginBottom: theme.spacing(1),
    paddingLeft: theme.spacing(5),
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userMessage: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  assistantMessage: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
  },
  toolMessage: {
    backgroundColor: theme.palette.secondary.dark,
    color: theme.palette.primary.dark,
  },
  assistantName: {
    color: theme.palette.text.primary,
  },
  creator: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.body2.fontSize,
  },
  stepContext: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.caption.fontSize,
  },
  markdownText: {
    fontFamily: theme.typography.fontFamily,
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  editButton: {
    padding: theme.spacing(0.5),
    '& svg': {
      fontSize: '0.875rem',
    },
  },
  viewButton: {
    padding: theme.spacing(0.5),
    marginRight: theme.spacing(1),
    '& svg': {
      fontSize: '0.875rem',
    },
  },
  metadataContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: theme.spacing(1),
  },
  metadata: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.caption.fontSize,
    '&:not(:last-child)': {
      marginBottom: theme.spacing(0.5),
    },
  },
  fileReferencesContainer: {
    marginTop: theme.spacing(1),
  },
  // New styles for MessageDetail
  messageDetail: {
    padding: theme.spacing(2),
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  jsonDisplay: {
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    overflowX: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  taskResponsesContainer: {
    marginTop: theme.spacing(1),
  },
}));

export default useStyles;