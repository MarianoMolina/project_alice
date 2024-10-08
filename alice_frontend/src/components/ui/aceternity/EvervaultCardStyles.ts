import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { alpha } from '@mui/material/styles';

const useStyles = makeStyles((theme: Theme) => ({
    avatarIcon: {
        backgroundColor: `${alpha(theme.palette.primary.light, 0)} !important`,
        color: `${theme.palette.primary.contrastText} !important`,
        width: `${theme.spacing(7)} !important`,
        height: `${theme.spacing(7)} !important`,
    },
    markStyles: {
        backgroundColor: `${theme.palette.common.white} !important`,
    },
}));

export default useStyles;