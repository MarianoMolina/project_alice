import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    content: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    chip: {
        margin: theme.spacing(0.25) + ' !important',
    },
    messageSmall: {
        marginBottom: theme.spacing(1),
        padding: theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    assistantMessage: {
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
    },
}));

export default useStyles;