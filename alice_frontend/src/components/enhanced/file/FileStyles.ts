import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    fileIcon: {
        fontSize: 48,
        marginBottom: theme.spacing(2),
    },
    fileDetails: {
        marginTop: theme.spacing(2),
    },
    fileAction: {
        marginTop: theme.spacing(2),
    },
    filePreviewContainer: {
        marginTop: theme.spacing(3),
        padding: theme.spacing(2),
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
    },
    previewTitle: {
        marginBottom: theme.spacing(2),
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
    toolMessage: {
        backgroundColor: theme.palette.secondary.dark,
        color: theme.palette.primary.dark,
    },
}));

export default useStyles;