import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  databaseContainer: {
    display: 'flex',
    height: '100%',
  },
  databaseMenu: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },  
  toggleBox: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(1),
  },
  databaseList: {
    width: '350px',
    borderRight: `1px solid ${theme.palette.divider}`,
    overflowY: 'auto',
  },
  databaseContent: {
    flexGrow: 1,
    padding: theme.spacing(2),
    overflowY: 'auto',
  },
  defaultCard: {
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  },
  createButton: {
    margin: '10px auto !important',
    display: 'inherit !important'
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
}));

export default useStyles;