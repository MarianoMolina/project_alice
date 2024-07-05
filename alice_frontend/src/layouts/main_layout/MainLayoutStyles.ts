import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  '@global': {
    '*': {
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
    },
    'html, body, #root': {
      height: '100%',
    },
    body: {
      overflowX: 'hidden',
    },
  },
  mainLayout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  mainLayoutHeader: {
    flexShrink: 0,
  },
  mainLayoutContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
}));

export default useStyles;