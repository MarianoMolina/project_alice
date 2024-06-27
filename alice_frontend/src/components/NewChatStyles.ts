import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  formControl: {
    flexGrow: 1,
    marginRight: theme.spacing(1),
  },
  inlineContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  slider: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  functionsSection: {
    flexGrow: 1,
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  viewButton: {
    marginLeft: theme.spacing(1),
  },
}));

export default useStyles;