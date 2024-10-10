import React from 'react';
import { Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';
import TabHeader from './SidetabHeader';

const useStyles = makeStyles((theme: Theme) => ({
  select: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
    '& .MuiSelect-select': {
      padding: theme.spacing(1),
    },
  },
}));

interface FilterSelectProps {
  title: string;
  currentSelection: string;
  options: string[];
  handleSelectionChange: (event: SelectChangeEvent<string>) => void;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ title, currentSelection, options, handleSelectionChange }) => {
  const classes = useStyles();

  return (
    <TabHeader title={title}>
      <Select
        value={currentSelection}
        onChange={handleSelectionChange}
        className={classes.select}
        displayEmpty
      >
        <MenuItem value="">
          <em>All</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </TabHeader>
  );
};

export default FilterSelect;