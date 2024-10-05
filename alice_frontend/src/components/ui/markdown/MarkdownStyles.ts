import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    rootLog: {
        backgroundColor: '#000',
        color: '#00ff00',
        fontFamily: 'monospace',
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
        maxHeight: '200px',
        overflowY: 'auto',
    },
    lineLog: {
        margin: 0,
        lineHeight: 1.5,
    },
    CodeBlockClass: {
        position: 'relative',
    },
    CopyButtonClass: {
        position: 'absolute',
        top: 4,
        right: 10,
        cursor: 'pointer',
        color: theme.palette.common.white,
        margin: 1,
        padding: '4px 8px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '4px',
        transition: 'all 0.3s ease',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        },
    },
    CopyIcon: {
        height: '0.8em !important',
        width: '0.8em !important',
        marginRight: '4px',
    },
    CopyButtonContent: {
        display: 'flex',
        alignItems: 'center',
    },
    CopyText: {
        fontSize: '0.8em !important',
        fontWeight: 'bold',
    },
}));

export default useStyles;