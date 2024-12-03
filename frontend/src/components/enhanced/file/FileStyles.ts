import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    fileIcon: {
        fontSize: 48,
        marginBottom: theme.spacing(2),
    },
    fileDetails: {
        marginTop: theme.spacing(2),
    },
    fileAction: {
        marginTop: theme.spacing(2),
    },
}));

export default useStyles;