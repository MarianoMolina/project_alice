import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { hexToRgba } from '../utils/StyleUtils';

const useStyles = makeStyles((theme: Theme) => ({
    knowledgebaseNavContainer: {
        width: 250, 
        overflow: 'auto',
    },
    knowledgebaseContentContainer: {
        overflow: 'auto',
        backgroundColor: hexToRgba(theme.palette.secondary.dark, 0.6)
    }
}));

export default useStyles;