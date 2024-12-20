import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Tooltip,
  Button,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Divider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../../contexts/AuthContext';
import useStyles from './HeaderStyles';
import Logger from '../../../utils/Logger';
import { getSectionsByNavGroup, siteSections } from '../../../utils/SectionIcons';

interface NavGroupProps {
  groupIndex: 1 | 2 | 3;
  children: React.ReactNode;
  isMobile?: boolean;
}

const Header: React.FC = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg')); // 1200px
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (path: string): void => {
    navigate(path);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = (): void => {
    Logger.info('Logging out');
    logout();
    navigate('/login');
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path: string): boolean => {
    if (path.endsWith('/')) {
      return location.pathname.startsWith(path);
    }
    return location.pathname === path;
  };

  const NavGroup: React.FC<NavGroupProps> = ({ groupIndex, children, isMobile }) => (
    <Box className={`${classes.navGroup} ${!isMobile ? classes[`group${groupIndex}`] : ''}`}>
      {children}
    </Box>
  );

  const renderNavButton = (sectionId: string, isMobileView = false) => {
    const section = siteSections[sectionId];
    
    if (isMobileView) {
      return (
        <ListItem 
          key={section.id}
          button
          onClick={() => handleNavigation(section.path)}
          selected={isActive(section.path)}
        >
          <ListItemIcon>
            <section.icon />
          </ListItemIcon>
          <ListItemText primary={section.title} />
        </ListItem>
      );
    }

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

  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      classes={{ paper: classes.drawer }}
    >
      <Box className={classes.drawerHeader}>
        <Typography variant="h6">Menu</Typography>
        <IconButton onClick={() => setMobileMenuOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List className={classes.mobileMenuList}>
        {renderNavButton('home', true)}
        <Divider />
        
        {isAuthenticated && (
          <>
            {[1, 2, 3].map((groupIndex) => (
              <Box key={groupIndex}>
                <NavGroup groupIndex={groupIndex as 1 | 2 | 3} isMobile>
                  {getSectionsByNavGroup(groupIndex as 1 | 2 | 3).map(section =>
                    renderNavButton(section.id, true)
                  )}
                </NavGroup>
                <Divider />
              </Box>
            ))}
          </>
        )}

        {isAuthenticated ? (
          <>
            {renderNavButton('settings', true)}
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <ListItem button onClick={() => handleNavigation('/login')}>
            <ListItemText primary="Login" />
          </ListItem>
        )}
      </List>
    </Drawer>
  );

  return (
    <AppBar position="static" className={classes.header}>
      <Toolbar className={classes.toolbar}>
        <Box className={classes.leftSection}>
          {renderNavButton('home')}
        </Box>
        
        {isAuthenticated && !isMobile && (
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
              {!isMobile && (
                <>
                  <Typography variant="body1" className={classes.userEmail}>
                    {user?.email}
                  </Typography>
                  {renderNavButton('settings')}
                </>
              )}
              {isMobile ? (
                <IconButton
                  color="inherit"
                  onClick={() => setMobileMenuOpen(true)}
                  edge="end"
                >
                  <MenuIcon />
                </IconButton>
              ) : (
                <Tooltip title="Logout">
                  <IconButton color="inherit" onClick={handleLogout}>
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          ) : (
            <Button color="inherit" onClick={() => handleNavigation('/login')}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
      {renderMobileMenu()}
    </AppBar>
  );
};

export default Header;