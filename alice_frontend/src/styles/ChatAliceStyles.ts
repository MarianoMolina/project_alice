import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  chatAliceContainer: {
    display: 'flex',
    height: '100%',
  },
  chatAliceMain: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    // maxWidth: '90%',
  },
  chatAliceMessages: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: theme.spacing(2),
  },
  chatAliceInput: {
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
}));

export default useStyles;