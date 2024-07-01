import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  chatList: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
}));

export default useStyles;