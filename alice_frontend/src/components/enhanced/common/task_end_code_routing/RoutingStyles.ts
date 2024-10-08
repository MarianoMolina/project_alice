import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    routeItem: {
        display: 'grid',
        gridTemplateColumns: '200px 200px 50px',
        gap: theme.spacing(2),
        alignItems: 'center',
        marginTop: theme.spacing(1),
    },
    exitCodeDescription: {
        color: theme.palette.text.primary,
        fontWeight: 'bold',
    },
    select: {
        minWidth: '150px',
    },
    checkboxColumn: {
        display: 'flex',
        justifyContent: 'center',
    },
    taskCard: {
        backgroundColor: theme.palette.secondary.dark,
        color: theme.palette.primary.dark,
        marginBottom: theme.spacing(1),
        padding: theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: '550px',
    },
    formControlCheckbox: {
        margin: '0 !important',
    },
    checkbox: {
        color: theme.palette.secondary.contrastText,
    },
    warningAlert: {
        marginBottom: theme.spacing(2),
    },

    saveButton: {
        marginTop: theme.spacing(2),
    },
}));

export default useStyles;