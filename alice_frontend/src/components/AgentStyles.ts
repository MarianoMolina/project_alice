import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    padding: theme.spacing(2),
  },
  formField: {
    marginBottom: theme.spacing(2),
  },
  promptContent: {
    marginBottom: theme.spacing(2),
  },
  saveButton: {
    marginTop: theme.spacing(2),
  },
}));

export default useStyles;