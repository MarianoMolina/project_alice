import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  chatAliceContainer: {
    display: 'flex',
    height: '100%',
    maxWidth: '100%',
  },
  chatAliceMain: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100%',
  },
  chatAliceMessages: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    margin: '0 10px',
    overflow: 'auto', 
    minHeight: 0,
  },
  chatAliceInput: {
    margin: theme.spacing(0, 1, 1, 1),
    display: 'flex',
    flexDirection: 'column',
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  activeListContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  activeListContent: {
    overflowY: 'auto',
    flexGrow: 1,
  },
}));

export default useStyles;