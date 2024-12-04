import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Tooltip, Button, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../../contexts/AuthContext';
import useStyles from './HeaderStyles';
import Logger from '../../../utils/Logger';
import { getSectionsByNavGroup, siteSections } from '../../../utils/SectionIcons';

interface NavGroupProps {
  groupIndex: 1 | 2 | 3;
  children: React.ReactNode;
}

const Header: React.FC = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const handleNavigation = (path: string): void => {
    navigate(path);
  };

  const handleLogout = (): void => {
    Logger.info('Logging out');
    logout();
    navigate('/login');
  };

  const isActive = (path: string): boolean => {
    if (path.endsWith('/')) {
      return location.pathname.startsWith(path);
    }
    return location.pathname === path;
  };

  const NavGroup: React.FC<NavGroupProps> = ({ groupIndex, children }) => (
    <Box className={`${classes.navGroup} ${classes[`group${groupIndex}`]}`}>
      {children}
    </Box>
  );

  const renderNavButton = (sectionId: string) => {
    const section = siteSections[sectionId];
    return (
      <Tooltip key={section.id} title={section.title}>
        <IconButton
          color="inherit"
          onClick={() => handleNavigation(section.path)}
          className={isActive(section.path) ? classes.activeButton : ''}
        >
          <section.icon />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <AppBar position="static" className={classes.header}>
      <Toolbar className={classes.toolbar}>
        <Box className={classes.leftSection}>
          {renderNavButton('home')}
        </Box>
        
        {isAuthenticated && (
          <Box className={classes.centerSection}>
            {[1, 2, 3].map((groupIndex) => (
              <NavGroup key={groupIndex} groupIndex={groupIndex as 1 | 2 | 3}>
                {getSectionsByNavGroup(groupIndex as 1 | 2 | 3).map(section => 
                  renderNavButton(section.id)
                )}
              </NavGroup>
            ))}
          </Box>
        )}

        <Box className={classes.rightSection}>
          {isAuthenticated ? (
            <>
              <Typography variant="body1" className={classes.userEmail}>
                {user?.email}
              </Typography>
              {renderNavButton('settings')}
              <Tooltip title="Logout">
                <IconButton color="inherit" onClick={handleLogout}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button color="inherit" onClick={() => handleNavigation('/login')}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;