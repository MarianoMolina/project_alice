import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { hexToRgba } from '../../../utils/StyleUtils';

const useStyles = makeStyles((theme: Theme) => ({
  header: {
    backgroundColor: `${hexToRgba(theme.palette.background.paper, 0.1)} !important`,
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
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
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
}));

export default useStyles;