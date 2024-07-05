import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  sidebar: {
    display: 'flex',
    height: '100%',
    backgroundColor: theme.palette.background.paper,
    transition: 'width 0.3s ease',
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  verticalMenu: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${theme.palette.divider}`,
    height: '100%',
    '& > *': {
      marginBottom: theme.spacing(1),
    },
  },
  expandButton: {
    marginTop: 'auto',
    marginBottom: theme.spacing(2),
  },
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    width: 'inherit',
  },
}));

export default useStyles;