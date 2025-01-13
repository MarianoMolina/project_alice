import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Tooltip,
  Button,
  useMediaQuery,
  useTheme,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useAuth } from '../../../contexts/AuthContext';
import useStyles from './HeaderStyles';
import Logger from '../../../utils/Logger';
import { getSectionsByNavGroup, siteSections } from '../../../utils/SectionIcons';
import { NavigationButton } from './NavigationButton';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';

interface NavGroupProps {
  groupIndex: 1 | 2 | 3;
  children: React.ReactNode;
  isMobile?: boolean;
}

const Header: React.FC = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleNavigation = (path: string): void => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserMenuAnchor(null);
  };

  const handleLogout = (): void => {
    Logger.info('Logging out');
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
    setUserMenuAnchor(null);
  };

  const handleGitHubClick = () => {
    window.open('https://github.com/MarianoMolina/project_alice', '_blank');
    setMobileMenuOpen(false);
    setUserMenuAnchor(null);
  };

  const NavGroup: React.FC<NavGroupProps> = ({ groupIndex, children, isMobile }) => (
    <Box className={`${classes.navGroup} ${!isMobile ? classes[`group${groupIndex}`] : ''}`}>
      {children}
    </Box>
  );

  return (
    <AppBar position="static" className={classes.header}>
      <Toolbar className={classes.toolbar}>
        <Box className={classes.leftSection}>
          <NavigationButton
            section={siteSections['home']}
            onClick={handleNavigation}
          />
        </Box>
        
        {isAuthenticated && !isMobile && (
          <Box className={classes.centerSection}>
            {[1, 2, 3].map((groupIndex) => (
              <NavGroup key={groupIndex} groupIndex={groupIndex as 1 | 2 | 3}>
                {getSectionsByNavGroup(groupIndex as 1 | 2 | 3).map(section => (
                  <NavigationButton
                    key={section.id}
                    section={section}
                    onClick={handleNavigation}
                  />
                ))}
              </NavGroup>
            ))}
          </Box>
        )}

        <Box className={classes.rightSection}>
          {isAuthenticated ? (
            <>
              {!isMobile && (
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                    size="small"
                    sx={{ ml: 2 }}
                  >
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {user?.email?.[0].toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
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
                <Tooltip title="GitHub Repository">
                  <IconButton color="inherit" onClick={handleGitHubClick}>
                    <GitHubIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          ) : (
            <>
            <Tooltip title="GitHub Repository">
              <IconButton color="inherit" onClick={handleGitHubClick}>
                <GitHubIcon />
              </IconButton>
            </Tooltip>
              <Button color="inherit" onClick={() => handleNavigation('/login')}>
                Login
              </Button>
            </>
          )}
        </Box>
      </Toolbar>

      <UserMenu
        user={user}
        anchorEl={userMenuAnchor}
        onClose={() => setUserMenuAnchor(null)}
        onLogout={handleLogout}
        onNavigate={handleNavigation}
      />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        onGitHubClick={handleGitHubClick}
        isAuthenticated={isAuthenticated}
        user={user}
        classes={classes}
      />
    </AppBar>
  );
};

export default Header;