import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    titleText: {
        marginTop: `${theme.spacing(2)} !important`,
    },
    section: {
        marginBottom: '24px',
    },
    sectionTitle: {
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    codeInput: {
        fontFamily: 'monospace',
    },
    codeDisplay: {
        marginTop: '16px',
        marginBottom: '16px',
    },
    outputDisplay: {
        marginTop: '16px',
        background: '#f5f5f5',
        borderRadius: '4px',
        padding: '16px',
    },
    exitCodeChip: {
        marginLeft: '12px',
    },
    exitCodeInput: {
        width: '150px',
    },
}));

export default useStyles;