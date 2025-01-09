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
    position: 'relative',
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
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '80%',
    margin: '0 10%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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