import { Box, Typography } from '@mui/material';
import { 
  Chat as MessageIcon,
  SmartToy as BotIcon,
  Build as WrenchIcon,
  Storage as DatabaseIcon
} from '@mui/icons-material';

const ChatOverviewSection = () => {
  return (
    <Box className="space-y-6">
      {/* Visual Overview */}
      <Box className="grid grid-cols-2 gap-4">
        <Box className="p-4 bg-slate-800 rounded-lg">
          <Box className="flex items-center gap-2 mb-2">
            <BotIcon className="text-blue-400" fontSize="small" />
            <Typography variant="subtitle1" className="text-neutral-200">
              Agent Configuration
            </Typography>
          </Box>
          <Typography variant="body2" className="text-neutral-300">
            Core model settings, system prompts, and permissions that define the chat's AI capabilities
          </Typography>
        </Box>

        <Box className="p-4 bg-slate-800 rounded-lg">
          <Box className="flex items-center gap-2 mb-2">
            <MessageIcon className="text-green-400" fontSize="small" />
            <Typography variant="subtitle1" className="text-neutral-200">
              Message Threads
            </Typography>
          </Box>
          <Typography variant="body2" className="text-neutral-300">
            Multiple conversation streams sharing the same agent and tool configurations
          </Typography>
        </Box>

        <Box className="p-4 bg-slate-800 rounded-lg">
          <Box className="flex items-center gap-2 mb-2">
            <WrenchIcon className="text-yellow-400" fontSize="small" />
            <Typography variant="subtitle1" className="text-neutral-200">
              Agent Tools
            </Typography>
          </Box>
          <Typography variant="body2" className="text-neutral-300">
            Standard operational tools available to the agent for executing tasks
          </Typography>
        </Box>

        <Box className="p-4 bg-slate-800 rounded-lg">
          <Box className="flex items-center gap-2 mb-2">
            <DatabaseIcon className="text-purple-400" fontSize="small" />
            <Typography variant="subtitle1" className="text-neutral-200">
              Retrieval Tools
            </Typography>
          </Box>
          <Typography variant="body2" className="text-neutral-300">
            Specialized tools for accessing and leveraging connected data clusters
          </Typography>
        </Box>
      </Box>

      {/* Interaction Flow */}
      <Box className="bg-slate-800 p-4 rounded-lg">
        <Typography variant="subtitle1" className="text-neutral-200 mb-2">
          Interaction Flow
        </Typography>
        <Box className="flex items-center justify-between text-neutral-300">
          <Box className="flex flex-col items-center">
            <Box className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mb-2">
              <Typography className="text-white">1</Typography>
            </Box>
            <Typography variant="body2">User Input</Typography>
          </Box>
          <Box className="flex-1 h-px bg-neutral-600 mx-2" />
          <Box className="flex flex-col items-center">
            <Box className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mb-2">
              <Typography className="text-white">2</Typography>
            </Box>
            <Typography variant="body2">Agent Processing</Typography>
          </Box>
          <Box className="flex-1 h-px bg-neutral-600 mx-2" />
          <Box className="flex flex-col items-center">
            <Box className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mb-2">
              <Typography className="text-white">3</Typography>
            </Box>
            <Typography variant="body2">Tool Usage</Typography>
          </Box>
          <Box className="flex-1 h-px bg-neutral-600 mx-2" />
          <Box className="flex flex-col items-center">
            <Box className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mb-2">
              <Typography className="text-white">4</Typography>
            </Box>
            <Typography variant="body2">Response</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatOverviewSection;