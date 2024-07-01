import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    height: '100%',
    overflowY: 'auto',
  },
  formControl: {
    width: '100%',
  },
  inlineContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    marginLeft: theme.spacing(1),
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
  createButton: {
    marginTop: theme.spacing(2),
  },
}));

export default useStyles;