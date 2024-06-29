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
  taskDetailsHeader: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
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
    overflowY: 'auto',
  },
  tasksList: {
    padding: 0,
  },
  newTaskButtonContainer: {
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  newTaskButton: {
    width: '100%',
  },
  taskId: {
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    marginTop: theme.spacing(1),
  },
  nestedList: {
    paddingLeft: theme.spacing(4),
  },
}));

export default useStyles;