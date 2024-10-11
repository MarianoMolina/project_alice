import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  metadataChip: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
  rootLog: {
    backgroundColor: '#000',
    color: '#00ff00',
    fontFamily: 'monospace',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    maxHeight: '200px',
    overflowY: 'auto',
},
}));

export default useStyles;