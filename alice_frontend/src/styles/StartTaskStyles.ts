import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    display: 'flex',
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    height: '100%',
    backgroundColor: theme.palette.background.paper,
    transition: 'width 0.3s ease',
  },
  sidebarContent: {
    flexGrow: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  mainContent: {
    flexGrow: 1,
    padding: theme.spacing(3),
    overflowY: 'auto',
  },
  taskCard: {
    marginBottom: theme.spacing(3),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
}));

export default useStyles;