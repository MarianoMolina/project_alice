import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
    maxWidth: 600,
    margin: 'auto',
  },
  formControl: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5),
    },
  },
  listItem: {
    paddingLeft: 0,
  },
  buttonContainer: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'flex-end',
    '& > *': {
      marginLeft: theme.spacing(1),
    },
  },
  addButton: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  taskId: {
    // You can add specific styles for taskId if needed
  },
  title: {
    // You can add specific styles for title if needed
  },
  taskCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  inputField: {
    marginBottom: theme.spacing(2),
  },
  executeButton: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  progressIndicator: {
    marginTop: theme.spacing(2),
  },
  successMessage: {
    color: theme.palette.success.main,
    marginTop: theme.spacing(2),
  },
  noTaskSelected: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  // New styles for added components
  resultContainer: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  },
  recentExecutionsContainer: {
    marginTop: theme.spacing(3),
  },
  accordionDetails: {
    flexDirection: 'column',
  },
  taskDetailItem: {
    marginBottom: theme.spacing(1),
  },
  preWrapper: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
  },
  recentExecutionItem: {
    marginBottom: theme.spacing(1),
  },
  reRunButton: {
    marginLeft: theme.spacing(1),
  },  
  chip: {
    margin: theme.spacing(0.5),
  },
  exitCodesContainer: {
    marginTop: theme.spacing(2),
  },
  exitCodeChip: {
    margin: theme.spacing(0.5),
    backgroundColor: theme.palette.grey[200],
  },
}));

export default useStyles;