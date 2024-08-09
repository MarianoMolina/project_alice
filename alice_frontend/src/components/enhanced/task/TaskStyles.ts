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

  taskCard: {
    height: '100%',
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
  accordionDetails: {
    flexDirection: 'column',
  },
  chip: {
    margin: theme.spacing(0.25) + ' !important',
  },
  exitCodeChip: {
    margin: theme.spacing(0.5),
    backgroundColor: theme.palette.grey[200],
  },
}));

export default useStyles;