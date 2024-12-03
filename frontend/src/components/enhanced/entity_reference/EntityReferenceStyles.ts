import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  sectionContainer: {
    marginTop: '20px',
    marginBottom: '20px',
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  chip: {
    margin: '4px',
  },
  imageContainer: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  imageField: {
    flex: 1,
  },
}));

export default useStyles;