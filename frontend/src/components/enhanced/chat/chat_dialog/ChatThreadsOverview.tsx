import { Box, Typography } from '@mui/material';
import { 
  Chat as MessageIcon,
  ForkRight as GitBranchIcon,
  Share as ShareIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const ThreadExample = ({ title, messages }: { title: string; messages: string[] }) => (
  <Box className="bg-slate-800 rounded-lg p-3 space-y-2">
    <Box className="flex items-center gap-2 mb-2">
      <MessageIcon className="text-blue-400" fontSize="small" />
      <Typography variant="subtitle2" className="text-neutral-200">
        {title}
      </Typography>
    </Box>
    {messages.map((msg, idx) => (
      <Box 
        key={idx}
        className="text-sm p-2 rounded bg-slate-700 text-neutral-300"
      >
        {msg}
      </Box>
    ))}
  </Box>
);

const ChatThreadsSection = () => {
  return (
    <Box className="space-y-6">
      {/* Thread Features */}
      <Box className="grid grid-cols-3 gap-4">
        <Box className="p-4 bg-slate-800 rounded-lg">
          <Box className="flex items-center gap-2 mb-2">
            <GitBranchIcon className="text-blue-400" fontSize="small" />
            <Typography variant="subtitle1" className="text-neutral-200">
              Parallel Conversations
            </Typography>
          </Box>
          <Typography variant="body2" className="text-neutral-300">
            Maintain multiple conversation threads while sharing the same agent and tool configurations
          </Typography>
        </Box>

        <Box className="p-4 bg-slate-800 rounded-lg">
          <Box className="flex items-center gap-2 mb-2">
            <ShareIcon className="text-green-400" fontSize="small" />
            <Typography variant="subtitle1" className="text-neutral-200">
              Shared Context
            </Typography>
          </Box>
          <Typography variant="body2" className="text-neutral-300">
            Access consistent agent capabilities and data resources across all threads
          </Typography>
        </Box>

        <Box className="p-4 bg-slate-800 rounded-lg">
          <Box className="flex items-center gap-2 mb-2">
            <HistoryIcon className="text-yellow-400" fontSize="small" />
            <Typography variant="subtitle1" className="text-neutral-200">
              Independent History
            </Typography>
          </Box>
          <Typography variant="body2" className="text-neutral-300">
            Each thread maintains its own conversation history and context
          </Typography>
        </Box>
      </Box>

      {/* Thread Examples */}
      <Typography variant="subtitle1" className="text-neutral-200 mb-2">
        Example Thread Structure
      </Typography>
      <Box className="grid grid-cols-2 gap-4">
        <ThreadExample 
          title="Research Thread"
          messages={[
            "Can you analyze this dataset?",
            "I'll help analyze the data using the configured tools...",
            "Here are the key insights from the analysis..."
          ]}
        />
        <ThreadExample 
          title="Implementation Thread"
          messages={[
            "Let's implement the findings from our analysis",
            "I'll help create a solution based on our research...",
            "Here's the implementation approach..."
          ]}
        />
      </Box>

      {/* Thread Benefits */}
      <Box className="bg-slate-800 p-4 rounded-lg">
        <Typography variant="subtitle1" className="text-neutral-200 mb-2">
          Benefits of Thread Organization
        </Typography>
        <ul className="list-disc pl-6 space-y-2 text-neutral-300">
          <li>Organize complex projects into focused conversation streams</li>
          <li>Maintain clear context for different aspects of work</li>
          <li>Switch between related discussions while preserving context</li>
          <li>Share agent capabilities efficiently across conversations</li>
        </ul>
      </Box>
    </Box>
  );
};

export default ChatThreadsSection;