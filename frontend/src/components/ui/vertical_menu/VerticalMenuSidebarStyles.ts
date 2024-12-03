import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { hexToRgba } from '../../../utils/StyleUtils';

const useStyles = makeStyles((theme: Theme) => ({
  sidebar: {
    display: 'flex',
    height: '100%',
    backgroundColor: hexToRgba(theme.palette.background.paper, 0.8),
    transition: 'width 0.3s ease',
  },
  verticalMenu: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  actionsSection: {
    backgroundColor: theme.palette.primary.main,
    padding: theme.spacing(1, 0),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tabsSection: {
    // padding: theme.spacing(1, 0),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tabGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(1, 0, 0, 0),
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(0.5, 0, 0, 0),
    '&:nth-of-type(1)': {
      '--group-color-0': hexToRgba(theme.palette.primary.main, 0.4),
    },
    '&:nth-of-type(2)': {
      '--group-color-1': hexToRgba(theme.palette.secondary.main, 0.4),
    },
    '&:nth-of-type(3)': {
      '--group-color-2': hexToRgba(theme.palette.info.light, 0.4),
    },
    '&:nth-of-type(4)': {
      '--group-color-3': hexToRgba(theme.palette.success.light, 0.4),
    },
    '&:nth-of-type(5)': {
      '--group-color-4': hexToRgba(theme.palette.warning.light, 0.4),
    },
  },
  groupLabel: {
    textTransform: 'uppercase',
    marginBottom: theme.spacing(0.5),
  },
  expandButton: {
    marginTop: 'auto',
    marginBottom: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    overflow: 'hidden',
    width: 'inherit',
  },
}));

export default useStyles;