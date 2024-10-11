import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        display: 'flex',
        height: '100%',
    },
    card: {
        marginBottom: theme.spacing(3),
    },
    userInfoHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: theme.spacing(2),
        '& > *:first-child': {
            marginRight: theme.spacing(1),
        },
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
    dangerZone: {
        paddingTop: theme.spacing(2),
    },
    dangerButton: {
        marginTop: theme.spacing(2),
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        '&:hover': {
            backgroundColor: theme.palette.error.dark,
        },
    },
    mainContainer: {
        overflow: 'auto',
    }
}));

export default useStyles;