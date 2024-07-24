import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        display: 'flex',
        height: '100%',
    },
    title: {
        marginBottom: theme.spacing(3),
    },
    card: {
        height: '100%',
    },
    userInfoHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: theme.spacing(2),
    },
    apiConfigHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing(2),
    },
    apiPaper: {
        padding: theme.spacing(2),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    saveButton: {
        marginTop: theme.spacing(2),
    },
    leaveButton: {
        marginTop: theme.spacing(3),
    },
}));

export default useStyles;