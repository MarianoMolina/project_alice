import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TableSortLabel
} from '@mui/material';
import { Visibility, ChevronRight } from '@mui/icons-material';

export interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  sortKey?: string;
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

type SortDirection = 'asc' | 'desc';

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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: Column<T>) => {
    if (column.sortKey) {
      const isAsc = sortColumn === column.sortKey && sortDirection === 'asc';
      setSortDirection(isAsc ? 'desc' : 'asc');
      setSortColumn(column.sortKey);
    }
  };

  const sortedItems = useMemo(() => {
    if (!items || !sortColumn) return items;
    return [...items].sort((a: any, b: any) => {
      if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortColumn, sortDirection]);

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
                <TableCell key={index}>
                  {column.sortKey ? (
                    <TableSortLabel
                      active={sortColumn === column.sortKey}
                      direction={sortColumn === column.sortKey ? sortDirection : 'asc'}
                      onClick={() => handleSort(column)}
                    >
                      {column.header}
                    </TableSortLabel>
                  ) : (
                    column.header
                  )}
                </TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {item ? renderItem(item) : sortedItems?.map(renderItem)}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default EnhancedTableView;