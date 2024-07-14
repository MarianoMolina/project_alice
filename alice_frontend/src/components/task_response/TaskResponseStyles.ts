import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  rootLog: {
    backgroundColor: '#000',
    color: '#00ff00',
    fontFamily: 'monospace',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  lineLog: {
    margin: 0,
    lineHeight: 1.5,
  },
}));

export default useStyles;