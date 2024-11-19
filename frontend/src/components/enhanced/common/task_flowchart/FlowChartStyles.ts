import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    flowChartContainer: {
        height: '1000px',
        flexGrow: 1,
        flexBasis: '500px',
    },  
}));

export default useStyles;