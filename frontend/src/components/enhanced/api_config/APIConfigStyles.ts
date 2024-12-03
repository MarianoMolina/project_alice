import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    titleText: {
        marginTop: `${theme.spacing(2)} !important`,
    }
}));

export default useStyles;