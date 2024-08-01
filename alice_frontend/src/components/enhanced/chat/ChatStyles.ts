import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  // Existing styles
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  messagesContainer: {
    flexGrow: 1,
    overflowY: 'auto',
  },
  actionButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  right_circle: {
    marginLeft: 'auto !important',
  },
  chatDetails: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
  },

  // Styles for different view modes
  listItem: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  card: {
    margin: theme.spacing(1),
    cursor: 'pointer',
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },
  detailView: {
    padding: theme.spacing(2),
    '& > *': {
      marginBottom: theme.spacing(1),
    },
  },
  fullChatView: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },

  // Styles for enhanced functionality
  chatTitle: {
    fontWeight: 'bold',
  },
  chatDate: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  functionsList: {
    maxHeight: '200px',
    overflowY: 'auto',
  },
  messageInput: {
    marginTop: theme.spacing(2),
  },
  sendButton: {
    marginLeft: theme.spacing(1),
  },

  // New styles for create/edit form
  createEditForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
  slider: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  createButton: {
    marginTop: theme.spacing(2),
  },

  // Additional styles for table view (if needed)
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  tableHead: {
    backgroundColor: theme.palette.primary.light,
  },
  tableRow: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
  },

  // New style for empty messages container
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
  skeleton: {
    height: '80px !important',
    marginBottom: theme.spacing(2),
  },
}));

export default useStyles;
