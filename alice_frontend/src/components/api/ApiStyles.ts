import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    interactable: {
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    formContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        padding: theme.spacing(2),
    },
    saveButton: {
        marginTop: theme.spacing(2),
    },
    fullListItem: {
        flexDirection: 'column',
        alignItems: 'flex-start !important',
    },
    fullListBox: {
        display: "flex", 
        width: "100%", 
        justifyContent: "space-between", 
        alignItems: "center" 
    }
}));

export default useStyles;