import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    height: '100%', 
    display: 'flex',
    flexDirection: 'column',
  },
  titleButtonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  tableContainer: {
    flexGrow: 1,
    overflow: 'auto',
    // This will allow vertical scroll while keeping the header fixed
    '& thead': {
      position: 'sticky',
      top: 0,
      backgroundColor: theme.palette.background.paper,
      zIndex: 1,
    },
  },
  circularProgressContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
}));

export default useStyles;