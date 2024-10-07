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
        overflow: 'hidden',
        maxWidth: '100%',
    },
    CodeBlockHeader: {
        position: 'absolute',
        top: 4,
        right: 10,
        zIndex: 1,
    },
    HeaderContent: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    LanguageTag: {
        color: theme.palette.common.white,
        fontSize: '0.75rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    CopyButtonClass: {
        cursor: 'pointer',
        color: theme.palette.common.white,
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

    markdownText: {
        fontSize: '1em !important',
        marginBottom: '0 !important',

    },
    markdownTitle: {
        fontSize: '1.25em !important',
    },
    heading: {
        fontWeight: 600,
        marginTop: '5px !important',
        fontSize: 'clamp(1rem, 2rem - 0.25rem * var(--heading-level), 2rem)',
        '$h1&': { '--heading-level': 1 },
        '$h2&': { '--heading-level': 2 },
        '$h3&': { '--heading-level': 3 },
        '$h4&': { '--heading-level': 4 },
        '$h5&': { '--heading-level': 5 },
        '$h6&': { '--heading-level': 6 },
    },
}));

export default useStyles;