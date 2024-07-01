import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  taskCard: {
    marginBottom: theme.spacing(3),
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
}));

export default useStyles;