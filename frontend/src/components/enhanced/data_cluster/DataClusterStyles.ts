import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    content: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    chip: {
        margin: theme.spacing(0.25) + ' !important',
    },
    titleText: {
        marginTop: `${theme.spacing(2)} !important`,
    }
}));

export default useStyles;