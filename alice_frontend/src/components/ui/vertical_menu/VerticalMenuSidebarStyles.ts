import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { hexToRgba } from '../../../utils/StyleUtils';

const useStyles = makeStyles((theme: Theme) => ({
  sidebar: {
    display: 'flex',
    height: '100%',
    backgroundColor: hexToRgba(theme.palette.background.paper, 0.7),
    transition: 'width 0.3s ease',
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  verticalMenu: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${theme.palette.divider}`,
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  actionsSection: {
    backgroundColor: theme.palette.action.hover,
    padding: theme.spacing(1, 0),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tabsSection: {
    padding: theme.spacing(1, 0),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  divider: {
    margin: theme.spacing(1, 0),
    width: '100%',
  },
  expandButton: {
    marginTop: 'auto',
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    width: 'inherit',
  },
}));

export default useStyles;