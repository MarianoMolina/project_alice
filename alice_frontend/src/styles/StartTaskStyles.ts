// StartTaskStyles.ts
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  },
  mainContainer: {
    display: 'flex',
    flexGrow: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  taskExecutionContainer: {
    flexBasis: '66.66%',
    padding: theme.spacing(3),
    overflowY: 'auto',
    height: '100%',
  },
  recentExecutionsContainer: {
    flexBasis: '33.33%',
    padding: theme.spacing(3),
    overflowY: 'auto',
    height: '100%',
    backgroundColor: theme.palette.background.default,
    borderLeft: `1px solid ${theme.palette.divider}`,
    transition: 'transform 0.3s ease-in-out',
  },
  toggleRecentExecutionsButton: {
    position: 'absolute',
    top: '50%',
    right: 0,
    transform: 'translateY(-50%)',
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

export default useStyles;