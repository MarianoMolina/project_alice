import { Tooltip, Typography, Box } from '@mui/material';
import CopyToClipboard from 'react-copy-to-clipboard';
import { CopyAll } from '@mui/icons-material';
import { styled } from '@mui/system';
import useStyles from './MarkdownStyles';
import { useNotification } from '../../../contexts/NotificationContext';

const ActionBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
});

type Props = {
  code: string;
  tooltip?: string;
  showLabel?: boolean;
};

export function CopyButton({
  code,
  tooltip = 'Copy code to clipboard',
  showLabel = false
}: Props) {
  const classes = useStyles();
  const { addNotification } = useNotification();

  const handleCopy = () => {
    addNotification('Copied to clipboard', 'success');
  };

  if (showLabel) {
    return (
      <CopyToClipboard text={code} onCopy={handleCopy}>
        <ActionBox>
          <CopyAll fontSize="small" />
          <Typography>Copy</Typography>
        </ActionBox>
      </CopyToClipboard>
    );
  }

  return (
    <Tooltip title={tooltip} placement="left">
      <button className={classes.CopyButtonClass}>
        <CopyToClipboard text={code} onCopy={handleCopy}>
          <div className={classes.CopyButtonContent}>
            <CopyAll className={classes.CopyIcon} />
          </div>
        </CopyToClipboard>
      </button>
    </Tooltip>
  );
}