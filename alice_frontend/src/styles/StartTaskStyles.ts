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
  mainContentContainer: {
    display: 'flex',
    flexGrow: 1,
  },
  mainContent: {
    flexBasis: '66.66%',
    padding: theme.spacing(3),
    overflowY: 'auto',
  },
  recentExecutionsContainer: {
    flexBasis: '33.33%',
    padding: theme.spacing(3),
    overflowY: 'auto',
    backgroundColor: theme.palette.background.default,
  }
}));

export default useStyles;