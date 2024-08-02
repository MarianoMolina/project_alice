import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    card: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    title: {
        marginBottom: theme.spacing(1),
    },
    promptId: {
        display: 'block',
        marginBottom: theme.spacing(2),
    },
    content: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    list: {
        padding: 0,
    },
    section: {
        marginTop: theme.spacing(2),
    },
    chipContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
        marginTop: theme.spacing(1),
    },
    chip: {
        margin: theme.spacing(0.5),
    },
}));

export default useStyles;