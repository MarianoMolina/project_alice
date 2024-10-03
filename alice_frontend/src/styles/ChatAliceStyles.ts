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
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(1),
  },
  chatAliceInput: {
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
}));

export default useStyles;