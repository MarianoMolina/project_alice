import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    container: {
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
    },
    mainContainer: {
        display: 'flex',
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        [`@media (max-width: 800px)`]: {
            flexDirection: 'column',
        },
    },
    taskExecutionContainer: {
        flexBasis: '66.66%',
        padding: theme.spacing(3),
        overflowY: 'auto',
        height: '100%',
        [`@media (max-width: 800px)`]: {
            flexBasis: 'auto',
            height: '50%',  // Take half the height in mobile view
            minHeight: '400px',  // Ensure minimum height for usability
        },
    },
    apiAndRecentExecutionsContainer: {
        flexBasis: '33.33%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: theme.palette.background.default,
        borderLeft: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        [`@media (max-width: 800px)`]: {
            flexBasis: 'auto',
            height: '50%',  // Take remaining height in mobile view
            borderLeft: 'none',
            borderTop: `1px solid ${theme.palette.divider}`,
        },
    },
    apiStatusContainer: {
        paddingTop: theme.spacing(1),
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    sectionTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: theme.spacing(2),
        color: theme.palette.primary.main,
    },
    apiTooltipContainer: {
        marginTop: theme.spacing(2),
        display: 'flex',
    },
    recentExecutionsAccordion: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        margin: '0 !important',
        height: '100%',
        overflow: 'hidden',
        '& .MuiCollapse-root': {
            height: '100%',
        },
        '& .MuiCollapse-wrapper': {
            height: '100%',
        },
        '& .MuiCollapse-wrapperInner': {
            height: '100%',
        },
        '& .MuiAccordion-region': {
            height: '100%',
        },
    },
    recentExecutionsAccordionDetails: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 !important',
        overflow: 'auto',
    },
    recentExecutionsList: {
        overflowY: 'auto',
        width: '100%',
        paddingTop: '0 !important',
        flexGrow: 1,
    },
    recentExecutionsAccordionSummary: {
        height: 'auto',
    },
    accordionRoot: {
        height: '100%',
    },
    activeListContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    activeListContent: {
        overflowY: 'auto',
        flexGrow: 1,
    },
}));

export default useStyles;