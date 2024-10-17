import { Theme } from "@mui/material";
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    card: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    cardContent: {
        maxHeight: '100%',
    },
    titleContainer: {
        position: 'relative',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        padding: theme.spacing(2),
        borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
        marginBottom: theme.spacing(1),
    },
    title: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    elementType: {
        position: 'absolute',
        top: -10,
        left: 8,
        fontSize: '0.75rem',
        padding: '0 4px',
        backgroundColor: theme.palette.primary.main,
        borderRadius: 4,
    },
    subtitle: {
        marginBottom: theme.spacing(1),
    },
    id: {
        display: 'block',
        marginBottom: theme.spacing(2),
    },
    cardList: {
        maxHeight: 'calc(100% - 100px)',
        overflowY: 'auto',
    },
    listItem: {
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: theme.spacing(2),
    },
    listItemContent: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        marginLeft: theme.spacing(2),
        maxWidth: 'calc(100% - 85px)',
    },
    listItemIcon: {
        minWidth: 'auto',
        marginRight: theme.spacing(2),
        marginTop: theme.spacing(1),
    },
    primaryText: {
        fontWeight: 'bold',
        fontSize: '1.1rem',
        color: theme.palette.text.primary,
        marginBottom: theme.spacing(0.5),
    },
    secondaryText: {
        width: '100%',
        color: theme.palette.text.secondary,
        fontSize: '0.9rem',
    },
    titleContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    downloadButton: {
        marginLeft: theme.spacing(2),
        color: theme.palette.secondary.light,
    },
    flexibleViewContainer: {
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(3),
        backgroundColor: `${theme.palette.background.paper}cc !important`,
    },
    elementTypeText: {
        position: 'absolute',
        top: -10,
        left: 8,
        fontSize: '0.75rem',
        padding: '0 4px',
        backgroundColor: theme.palette.primary.main,
        borderRadius: 4,
    },
    formContainer: {
        flexGrow: 1,
        marginBottom: theme.spacing(3),
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
    },
}));

export default useStyles;