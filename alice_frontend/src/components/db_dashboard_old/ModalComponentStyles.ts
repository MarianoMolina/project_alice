import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  modalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '90%',
    maxHeight: '90%',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[24],
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: theme.spacing(2.5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    zIndex: 1,
    flexShrink: 0,
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(2.5),
  },
  form: {
    '& .rjsf': {
      flex: 1,
      overflowY: 'auto',
    },
    '& .MuiFormControl-root > .MuiGrid-container': {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
    },
    '& > .MuiBox-root': {
      marginTop: theme.spacing(2.5),
      display: 'flex',
      position: 'sticky',
      bottom: 0,
      padding: `${theme.spacing(1.25)} 0`,
      zIndex: 1,
      backgroundColor: theme.palette.background.paper,
    },
  },
  closeButton: {
    color: theme.palette.primary.contrastText,
  },
}));

export default useStyles;