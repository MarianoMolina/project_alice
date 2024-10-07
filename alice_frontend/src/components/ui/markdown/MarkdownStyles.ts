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
    h1: {
        fontWeight: 600,
        marginTop: '5px !important',
        fontSize: 'clamp(1.5rem, 2.5rem, 3rem) !important',
    },
    h2: {
        fontWeight: 600,
        marginTop: '5px !important',
        fontSize: 'clamp(1.4rem, 2.25rem, 2.75rem) !important',
    },
    h3: {
        fontWeight: 600,
        marginTop: '5px !important',
        fontSize: 'clamp(1.3rem, 2rem, 2.5rem) !important',
    },
    h4: {
        fontWeight: 600,
        marginTop: '5px !important',
        fontSize: 'clamp(1.2rem, 1.75rem, 2.25rem) !important',
    },
    h5: {
        fontWeight: 600,
        marginTop: '5px !important',
        fontSize: 'clamp(1.1rem, 1.5rem, 2rem) !important',
    },
    h6: {
        fontWeight: 600,
        marginTop: '5px !important',
        fontSize: 'clamp(1rem, 1.25rem, 1.75rem) !important',
    },
}));

export default useStyles;