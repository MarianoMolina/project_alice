import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  fullChatView: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative',
  },
  messagesContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    paddingBottom: theme.spacing(8), // Add padding to account for the action button
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: theme.spacing(0.5),
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    background: 'transparent',
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
  },
}));

export default useStyles;
