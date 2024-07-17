import React from 'react';
import { Container, Box, Typography, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SettingsApplications, Storage, Chat, Task, PlayArrow } from '@mui/icons-material';
import useStyles from './DashboardStyles';
import { WavyBackground } from './WavyBackground';
import { EvervaultCard } from './EvervaultCard';

const Dashboard: React.FC = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const cardDetails = [
    { title: "Tasks", description: "Start and execute a new task.", icon: <Task />, path: "/start-task" },
    { title: "Chat", description: "Engage in a conversation with Alice.", icon: <Chat />, path: "/chat-alice" },
    { title: "Database", description: "Access and view the database.", icon: <Storage />, path: "/database" },
    { title: "Settings", description: "Modify your user and API settings.", icon: <SettingsApplications />, path: "/user-settings" },
  ];

  return (
    <WavyBackground>
      <Container component="main" className={classes.container}>
        <Box className={classes.gridContainer}>
          <Grid container spacing={4} className={classes.grid}>
            {cardDetails.map((card, index) => (
              <Grid item xs={12} sm={6} className={classes.gridItem} key={index}>
                <Card className={classes.card}>
                  <EvervaultCard text={card.title} className='text-center'/>
                  <CardContent className={classes.cardContent}>
                    <Box className={classes.cardText}>
                      <Typography variant="h5" component="div">
                        {card.icon} {card.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.description}
                      </Typography>
                    </Box>
                    <CardActions className={classes.cardActions}>
                      <Button size="large" variant="contained" color="primary" onClick={() => handleNavigation(card.path)}>
                        <PlayArrow />GO
                      </Button>
                    </CardActions>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </WavyBackground>
  );
};

export default Dashboard;
