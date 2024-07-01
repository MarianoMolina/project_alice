import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
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
}));

export default useStyles;