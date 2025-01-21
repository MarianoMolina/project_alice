import { useState, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Collapse
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info
} from '@mui/icons-material';
import { useApi } from '../../../contexts/ApiContext';
import { hasValidationWarnings } from '../../../utils/ApiUtils';
import APICapabilitiesDialog from './api_dialog/ApiCapabilitiesDialog';

interface ApiValidationManagerProps {
  chatId?: string;
  taskId?: string;
  onValidationComplete?: (hasWarnings: boolean) => void;
}

export default function ApiValidationManager({
  chatId,
  taskId,
  onValidationComplete
}: ApiValidationManagerProps) {
  const { validateChatApis, validateTaskApis } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [showCapabilities, setShowCapabilities] = useState(false);

  const handleValidation = useCallback(async () => {
    if (!chatId && !taskId) {
      setError('Either chatId or taskId must be provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = chatId
        ? await validateChatApis(chatId)
        : await validateTaskApis(taskId!);

      setValidationResult(result);
      const warnings = hasValidationWarnings(result);
      onValidationComplete?.(warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during validation');
    } finally {
      setLoading(false);
    }
  }, [chatId, taskId, validateChatApis, validateTaskApis, onValidationComplete]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const renderWarnings = (warnings: string[]) => {
    if (!warnings.length) return null;
    return (
      <Box sx={{ ml: 4 }}>
        {warnings.map((warning, index) => (
          <Typography key={index} color="warning.main">
            • {warning}
          </Typography>
        ))}
      </Box>
    );
  };

  const renderTaskValidation = (task: any, level = 0) => (
    <Box key={task.task_name} sx={{ ml: level * 4 }}>
      <ListItem>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {task.status === 'valid'
                ? <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                : <WarningIcon color="warning" sx={{ fontSize: 20 }} />
              }
              <Typography>{task.task_name}</Typography>
            </Box>
          }
        />
        {task.child_tasks.length > 0 && (
          <IconButton
            onClick={() => toggleSection(task.task_name)}
            size="small"
          >
            {expandedSections.includes(task.task_name) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </ListItem>
      {renderWarnings(task.warnings)}
      {task.child_tasks.length > 0 && (
        <Collapse in={expandedSections.includes(task.task_name)}>
          <List>
            {task.child_tasks.map((childTask: any) =>
              renderTaskValidation(childTask, level + 1)
            )}
          </List>
        </Collapse>
      )}
    </Box>
  );

  const renderChatValidation = (chat: any) => (
    <Box>
      <ListItem>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {chat.status === 'valid'
                ? <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                : <WarningIcon color="warning" sx={{ fontSize: 20 }} />
              }
              <Typography>{chat.chat_name}</Typography>
            </Box>
          }
          secondary={`LLM API Status: ${chat.llm_api}`}
        />
      </ListItem>
      {renderWarnings(chat.warnings)}

      {chat.agent_tools.length > 0 && (
        <>
          <Typography sx={{ mt: 2, mb: 1 }} fontWeight="bold">Agent Tools</Typography>
          <List>
            {chat.agent_tools.map((tool: any) => renderTaskValidation(tool))}
          </List>
        </>
      )}

      {chat.retrieval_tools.length > 0 && (
        <>
          <Typography sx={{ mt: 2, mb: 1 }} fontWeight="bold">Retrieval Tools</Typography>
          <List>
            {chat.retrieval_tools.map((tool: any) => renderTaskValidation(tool))}
          </List>
        </>
      )}
    </Box>
  );

  const getStatusIcon = () => {
    if (!validationResult) return null;
    const hasWarnings = hasValidationWarnings(validationResult);

    return hasWarnings
      ? <WarningIcon color="warning" sx={{ fontSize: 20 }} />
      : <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />;
  };

  return (
    <Box>
      {/* Main validation status and controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <>
            {getStatusIcon()}
            <IconButton onClick={handleValidation} size="small" title="Refresh validation">
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
            {validationResult && (
              <Button
                variant="text"
                size="small"
                onClick={() => setDialogOpen(true)}
              >
                View Report
              </Button>
            )}
          </>
        )}
      </Box>

      {/* Error display */}
      {error && (
        <Alert
          severity="error"
          sx={{ mt: 1 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <ErrorIcon sx={{ fontSize: 20 }} />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Detailed report dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          API Validation Report
          <IconButton onClick={() => setShowCapabilities(true)} >
            <Info/>
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {validationResult && (
            <Box sx={{ mt: 1 }}>
              {chatId
                ? renderChatValidation(validationResult)
                : renderTaskValidation(validationResult)
              }
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleValidation}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            Refresh
          </Button>
        </DialogActions>
      </Dialog>

      <APICapabilitiesDialog
        open={showCapabilities}
        onClose={() => setShowCapabilities(false)}
      />
    </Box>
  );
}