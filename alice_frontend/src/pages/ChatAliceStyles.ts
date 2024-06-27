import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  chatAliceContainer: {
    display: 'flex',
    height: '100%',
  },
  chatAliceSidebar: {
    width: 240,
    overflowY: 'auto',
    borderRight: `1px solid ${theme.palette.divider}`,
    overflowX: 'hidden',
  },
  chatAliceMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatAliceMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(2.5),
  },
  chatAliceInput: {
    padding: theme.spacing(2.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  chatContentArea: {
    height: 'calc(100vh - 64px)',
    overflowY: 'auto',
  },
  message: {
    marginBottom: theme.spacing(1),
    paddingLeft: theme.spacing(5),
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
  },
  userMessage: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  assistantMessage: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
  },
  otherMessage: {
    backgroundColor: theme.palette.grey[300],
  },
  assistantName: {
    color: theme.palette.text.primary,
  },
  creator: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.body2.fontSize,
  },
  stepContext: {
    color: theme.palette.text.secondary,
    fontSize: theme.typography.caption.fontSize,
  },
  markdownText: {
    fontFamily: theme.typography.fontFamily,
  },
}));

export default useStyles;