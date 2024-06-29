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
}));

export default useStyles;