import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  entityReferenceCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    transition: 'box-shadow 0.3s ease-in-out',
    '&:hover': {
      boxShadow: theme.shadows[3],
    },
  },
  entityReferenceContent: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(1),
  },
  sectionLabel: {
    fontWeight: 'bold',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  },
  entityReferenceTitle: {
    marginBottom: theme.spacing(1),
  },
  entityReferenceUrl: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    wordBreak: 'break-all',
  },
  entityReferenceBody: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  entityReferenceMetadata: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
  metadataChip: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
  searchResultCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    transition: 'box-shadow 0.3s ease-in-out',
    '&:hover': {
      boxShadow: theme.shadows[3],
    },
  },
  searchResultContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  searchResultTitle: {
    marginBottom: theme.spacing(1),
  },
  searchResultUrl: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    wordBreak: 'break-all',
  },
  searchResultBody: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  searchResultMetadata: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
  messageSmall: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  titleText: {
    marginTop: `${theme.spacing(2)} !important`,
  }
}));

export default useStyles;