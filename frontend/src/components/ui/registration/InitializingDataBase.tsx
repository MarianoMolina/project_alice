import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { 
  Storage as StorageIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';

interface BentoItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const BentoItem: React.FC<BentoItemProps> = ({ icon, title, description }) => (
  <Box
    sx={{
      p: 2,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    }}
  >
    {icon}
    <Typography variant="h6" component="h3">
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Box>
);

const InitializingDatabase: React.FC = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Setting up your workspace...
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <BentoItem
            icon={<StorageIcon color="primary" />}
            title="Database Setup"
            description="Creating your secure database instance"
          />
        </Grid>
        <Grid item xs={6}>
          <BentoItem
            icon={<SecurityIcon color="primary" />}
            title="Security"
            description="Configuring encryption and security measures"
          />
        </Grid>
        <Grid item xs={12}>
          <BentoItem
            icon={<CloudIcon color="primary" />}
            title="Cloud Configuration"
            description="Setting up your cloud workspace and connections"
          />
        </Grid>
        <Grid item xs={6}>
          <BentoItem
            icon={<SettingsIcon color="primary" />}
            title="Preferences"
            description="Initializing default settings and preferences"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default InitializingDatabase;