import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)', // Adjust this if you have a different app bar height
    padding: theme.spacing(2),
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
  },
  button: {
    margin: theme.spacing(0.5),
  },
  listPageContainer: {
    flexGrow: 1,
    overflow: 'hidden',
  },
}));

export default useStyles;