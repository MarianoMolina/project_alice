import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  sidebar: {
    width: 240,
    backgroundColor: theme.palette.background.paper,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  accordionsContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  accordion: {
    flexShrink: 0,
    marginBottom: '0 !important',
    marginTop: '0 !important',
  },
  accordionDetails: {
    padding: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 250px)', // Adjust this value as needed
    overflowY: 'auto',
  },
  chatsList: {
    padding: 0,
  },
  newChatButtonContainer: {
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  newChatButton: {
    width: '100%',
  },
  sectionTitle: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    fontWeight: 600,
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
  fallbackText: {
    color: theme.palette.text.disabled,
    fontSize: '0.875rem',
    padding: theme.spacing(1, 2),
  },
  chatId: {
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    marginBottom: theme.spacing(1),
  },
}));

export default useStyles;