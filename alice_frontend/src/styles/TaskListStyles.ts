import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  taskList: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  title: {
    marginBottom: theme.spacing(2),
  },
}));

export default useStyles;