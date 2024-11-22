import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

// Styles
export const useStyles = makeStyles((theme: Theme) => ({
    nodeContainer: {
        position: 'relative',
        paddingLeft: theme.spacing(3),
        width: '100%',
        '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: theme.palette.divider,
        }
    },
    nodeContent: {
        position: 'relative',
        '&::before': {
            content: '""',
            position: 'absolute',
            left: theme.spacing(-3),
            top: theme.spacing(3),
            width: theme.spacing(3),
            height: 2,
            backgroundColor: theme.palette.divider,
        }
    },
    nodeHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: theme.spacing(1),
        padding: theme.spacing(1),
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[1],
        width: '100%',
    },
    exitCodeChip: {
        marginLeft: theme.spacing(1),
        '&.success': {
            backgroundColor: theme.palette.success.main,
            color: theme.palette.success.contrastText,
        },
        '&.warning': {
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
        },
        '&.error': {
            backgroundColor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
        },
    },
    subSection: {
      marginBottom: theme.spacing(2),
      '&:last-child': {
        marginBottom: 0,
      },
    }
}));