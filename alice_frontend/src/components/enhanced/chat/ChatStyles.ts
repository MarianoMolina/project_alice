import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  messagesContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    // display: 'grid',
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  fullChatView: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  emptyMessagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  skeletonContainer: {
    width: '100%',
    margin: theme.spacing(2, 0),
  },
  titleText: {
    marginTop: `${theme.spacing(2)} !important`,
  }
}));

export default useStyles;
