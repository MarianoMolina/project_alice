import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100vh',
    padding: theme.spacing(2),
  },
  actionButtonContainer: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
}));

export default useStyles;