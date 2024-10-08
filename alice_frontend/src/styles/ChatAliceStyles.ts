import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  chatAliceContainer: {
    display: 'flex',
    height: '100%',
    maxWidth: '100%',
    // overflow: 'hidden',
  },
  chatAliceMain: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'auto',
  },
  chatAliceMessages: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    margin: '0 10px',
    maxHeight: 'calc(100% - 73px)',
  },
  chatAliceInput: {
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  activeListContainer: {
    height: '100%',
    overflowY: 'auto',
  }
}));

export default useStyles;