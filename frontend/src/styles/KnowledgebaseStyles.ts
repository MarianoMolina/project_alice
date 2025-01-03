import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { hexToRgba } from '../utils/StyleUtils';

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
    },
    toggleButton: {
        position: 'absolute',
        top: '50%',
        left: theme.spacing(2),
        transform: 'translateY(-50%)',
        zIndex: 1200,
        backgroundColor: `${hexToRgba(theme.palette.primary.main, 0.3)} !important`,
        boxShadow: theme.shadows[2],
        width: 36,
        height: 36,
        borderRadius: '50%',
        transition: theme.transitions.create(['left', 'transform'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        })
    },
    toggleButtonOpen: {
        transform: 'translateY(-50%) translateX(250px)',
    },
    toggleButtonClosed: {
        transform: 'translateY(-50%) translateX(0)',
    },
    contentWrapper: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        height: '100%',
    },
    navigationWrapper: {
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        backgroundColor: theme.palette.background.paper,
        overflow: 'auto',
        width: 250,
        flexShrink: 0,
        [theme.breakpoints.down('sm')]: {
            position: 'fixed',
            top: 56,
            left: 0,
            height: '100%',
            zIndex: 1100,
            boxShadow: theme.shadows[8],
        },
    },
    navigationOpen: {
        width: 250,
        [theme.breakpoints.down('sm')]: {
            transform: 'translateX(0)',
        },
    },
    navigationClosed: {
        width: 0,
        [theme.breakpoints.down('sm')]: {
            transform: 'translateX(-100%)',
        },
    },
    mainContent: {
        flex: 1,
        overflow: 'auto',
        padding: theme.spacing(3),
        backgroundColor: hexToRgba(theme.palette.secondary.dark, 0.7),
        transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        position: 'relative', // Added to establish positioning context for toggle button
    },
}));

export default useStyles;