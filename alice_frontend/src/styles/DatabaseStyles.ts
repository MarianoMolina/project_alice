import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  databaseContainer: {
    display: 'flex',
    height: '100%',
  },
  databaseContent: {
    flexGrow: 1,
    padding: theme.spacing(2),
    overflowY: 'auto',
  },
}));

export default useStyles;