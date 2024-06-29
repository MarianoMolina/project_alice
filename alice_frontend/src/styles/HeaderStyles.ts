import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
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