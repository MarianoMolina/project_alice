import { Tooltip, Typography } from '@mui/material';
import CopyToClipboard from 'react-copy-to-clipboard';
import { CopyAll } from '@mui/icons-material';
import useStyles from './MarkdownStyles';
import { useNotification } from '../../../contexts/NotificationContext';

type Props = {
  code: string;
  tooltip?: string
};

export function CopyButton({ 
  code,
  tooltip = 'Copy code to clipboard'

 }: Props) {
  const classes = useStyles();
  const { addNotification } = useNotification();

  return (
    <Tooltip title={tooltip} placement="left">
      <button className={classes.CopyButtonClass}>
        <CopyToClipboard text={code} onCopy={()=> addNotification('Copied to clipboard', 'success')}>
          <div className={classes.CopyButtonContent}>
            <CopyAll className={classes.CopyIcon}/> <Typography className={classes.CopyText}>Copy</Typography>
          </div>
        </CopyToClipboard>
      </button>
    </Tooltip>
  );
}