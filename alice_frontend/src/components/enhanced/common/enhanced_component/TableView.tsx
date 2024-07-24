import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility, ChevronRight } from '@mui/icons-material';

interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
}

interface EnhancedTableViewProps<T> {
  items: T[] | null;
  item: T | null;
  columns: Column<T>[];
  onView?: (item: T) => void;
  onInteraction?: (item: T) => void;
  showHeaders?: boolean;
  interactionTooltip?: string;
  viewTooltip?: string;
}

function EnhancedTableView<T>({
  items,
  item,
  columns,
  onView,
  onInteraction,
  showHeaders = true,
  interactionTooltip = "Select Item",
  viewTooltip = "View Item",
}: EnhancedTableViewProps<T>) {
  const renderItem = (itemToRender: T) => (
    <TableRow key={JSON.stringify(itemToRender)}>
      {columns.map((column, index) => (
        <TableCell key={index}>{column.render(itemToRender)}</TableCell>
      ))}
      <TableCell>
        {onView && (
          <Tooltip title={viewTooltip}>
            <IconButton onClick={() => onView(itemToRender)}>
              <Visibility />
            </IconButton>
          </Tooltip>
        )}
        {onInteraction && (
          <Tooltip title={interactionTooltip}>
            <IconButton onClick={() => onInteraction(itemToRender)}>
              <ChevronRight />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <TableContainer component={Paper}>
      <Table>
        {showHeaders && (
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index}>{column.header}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {item ? renderItem(item) : items?.map(renderItem)}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default EnhancedTableView;