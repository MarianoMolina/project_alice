import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { hexToRgba } from '../../../../utils/StyleUtils';

const useStyles = makeStyles((theme: Theme) => ({
  selectContainer: {
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
    boxShadow: theme.shadows[1],
    position: 'relative',
  },
  label: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
    position: 'absolute',
    top: -10,
    left: 8,
    padding: '0 4px',
    backgroundColor: hexToRgba(theme.palette.primary.main, 0.5),
    borderRadius: 4,
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  chip: {
    margin: theme.spacing(0.25) + ' !important',
    backgroundColor: theme.palette.action.selected,
    height: '48px !important',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  editButton: {
    marginLeft: theme.spacing(1),
  },
  divider: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
}));

export default useStyles;