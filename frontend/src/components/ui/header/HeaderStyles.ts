import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { hexToRgba } from '../../../utils/StyleUtils';

const useStyles = makeStyles((theme: Theme) => ({
  header: {
    backgroundColor: `${hexToRgba(theme.palette.background.paper, 0.7)} !important`,
    backgroundImage: 'none !important',
    boxShadow: 'none !important',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  centerSection: {
    flex: 2,
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(3), 
  },
  rightSection: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  userEmail: {
    marginRight: theme.spacing(2),
  },
  activeButton: {
    '&.MuiIconButton-root': {
      backgroundColor: `${theme.palette.primary.dark} !important`,
      color: `${theme.palette.primary.contrastText} !important`,
      '&:hover': {
        backgroundColor: `${theme.palette.primary.main} !important`,
      },
    },
  },
  navGroup: {
    display: 'flex',
    padding: theme.spacing(1, 2),
    borderRadius: theme.shape.borderRadius,
    '& .MuiIconButton-root': {
      margin: theme.spacing(0, 0.5),
    },
  },
  group1: {
    backgroundColor: hexToRgba(theme.palette.primary.main, 0.1),
    '&:hover': {
      backgroundColor: hexToRgba(theme.palette.primary.main, 0.15),
    },
  },
  group2: {
    backgroundColor: hexToRgba(theme.palette.secondary.main, 0.1),
    '&:hover': {
      backgroundColor: hexToRgba(theme.palette.secondary.main, 0.15),
    },
  },
  group3: {
    backgroundColor: hexToRgba(theme.palette.info.light, 0.1),
    '&:hover': {
      backgroundColor: hexToRgba(theme.palette.info.light, 0.15),
    },
  },
}));

export default useStyles;