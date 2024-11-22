import React from 'react';
import { Container, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PlayArrow, Code } from '@mui/icons-material';
import useStyles from './DashboardStyles';
import { EvervaultCard } from '../aceternity/EvervaultCard';
import logo from '../../../assets/img/logo1024.png';

const Dashboard: React.FC = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  const cardDetails = [
    {
      title: "Chat with Alice",
      description: "Continue a chat, adjust the agent's skills or start a new one with a different agent.",
      image: logo,
      path: "/chat-alice",
    },
    {
      title: "Test and Deploy Skills",
      description: "Execute tasks to test agent functionality. Add results to chats!",
      icon: <PlayArrow />,
      path: "/start-task"
    },
    {
      title: "Develop Agents and Skills",
      description: "Build new prompts, agents and tasks to deploy.",
      icon: <Code />,
      path: "/structures"
    },
  ];

  return (
    <Container maxWidth="md" className={classes.container}>
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} className={classes.gridItem}>
          <EvervaultCard
            title={cardDetails[0].title}
            description={cardDetails[0].description}
            image={cardDetails[0].image}
            onClick={() => navigate(cardDetails[0].path)}
          />
        </Grid>
        <Grid item xs={6} className={classes.gridItem}>
          <EvervaultCard
            title={cardDetails[1].title}
            description={cardDetails[1].description}
            icon={cardDetails[1].icon}
            onClick={() => navigate(cardDetails[1].path)}
          />
        </Grid>
        <Grid item xs={6} className={classes.gridItem}>
          <EvervaultCard
            title={cardDetails[2].title}
            description={cardDetails[2].description}
            icon={cardDetails[2].icon}
            onClick={() => navigate(cardDetails[2].path)}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;