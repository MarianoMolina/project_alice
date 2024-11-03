import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NavLink } from 'react-router-dom';
import { NavItem, navigation } from './NavigationTypes';
import useStyles, { DepthClass } from './KnowledgebaseStyles';
import clsx from 'clsx';

const getDepthClass = (depth: number): DepthClass => {
  const validDepth = Math.min(Math.max(depth, 0), 2);
  return `depth${validDepth}` as DepthClass;
};

const NavItemComponent: React.FC<{ item: NavItem }> = ({ item }) => {
  const classes = useStyles();
  const depthClass = getDepthClass(item.depth);
  
  if (item.type === 'section' && item.items) {
    return (
      <Accordion className={classes.accordion} elevation={0}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          className={classes.accordionSummary}
        >
          <Typography className={classes[depthClass]}>
            {item.title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails className={classes.accordionDetails}>
          <div className={classes.hierarchyContainer}>
            <List component="div" disablePadding className={classes.nestedList}>
              {item.items.map((subItem, index) => (
                <NavItemComponent key={index} item={subItem} />
              ))}
            </List>
          </div>
        </AccordionDetails>
      </Accordion>
    );
  }

  return (
    <ListItem
      component={NavLink}
      to={item.path || ''}
      className={clsx(classes.listItem, {
        [classes.title]: item.type === 'title'
      })}
    >
      <ListItemText
        primary={item.title}
        primaryTypographyProps={{
          className: classes[depthClass],
        }}
      />
    </ListItem>
  );
};

const KnowledgebaseNavigation: React.FC = () => {
  const classes = useStyles();
  
  return (
    <List component="nav" className={classes.nav}>
      {navigation.map((section, index) => (
        <Accordion 
          key={index} 
          className={classes.mainAccordion} 
          elevation={0}
          defaultExpanded
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className={classes.accordionSummary}
          >
            <Typography className={classes.sectionTitle}>
              {section.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.accordionDetails}>
            <div className={classes.hierarchyContainer}>
              {section.titleArticle && (
                <NavItemComponent
                  item={{
                    ...section.titleArticle,
                    type: 'title',
                    depth: section.depth + 1,
                  }}
                />
              )}
              <List component="div" disablePadding>
                {section.items.map((item, itemIndex) => (
                  <NavItemComponent key={itemIndex} item={item} />
                ))}
              </List>
            </div>
          </AccordionDetails>
        </Accordion>
      ))}
    </List>
  );
};

export default KnowledgebaseNavigation;