import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    display: 'flex',
    height: '100%',
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  tabsContainer: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  tabPanel: {
    flexGrow: 1,
    overflow: 'auto',
    height: 'calc(100% - 48px)', // Subtracting the height of the tabs
    padding: theme.spacing(2),
  },
  executeTaskContainer: {
    display: 'flex',
    height: '100%',
  },
  taskExecuteContainer: {
    flexGrow: 1,
    marginLeft: theme.spacing(2),
    overflow: 'auto',
  },
  taskResultsTable: {
    marginTop: theme.spacing(2),
  },
  taskCard: {
    padding: theme.spacing(2),
  },
  inputField: {
    marginBottom: theme.spacing(2),
  },
  executeButton: {
    marginTop: theme.spacing(2),
  },
  disabledCard: {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.text.disabled,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default useStyles;