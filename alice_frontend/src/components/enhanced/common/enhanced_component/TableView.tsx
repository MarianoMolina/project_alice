import React, { useState, useMemo, useCallback } from 'react';
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
  TableSortLabel,
} from '@mui/material';
import { Visibility, ChevronRight } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

const StyledTableCell = styled(TableCell)({
  maxWidth: 200,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: '8px',
});

function EnhancedTableView<T>({
  items,
  item,
  columns,
  onView,
  onInteraction,
  showHeaders = true,
  interactionTooltip = 'Select Item',
  viewTooltip = 'View Item',
}: EnhancedTableViewProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = useCallback(
    (column: Column<T>) => {
      if (column.sortKey) {
        const isAsc = sortColumn === column.sortKey && sortDirection === 'asc';
        setSortDirection(isAsc ? 'desc' : 'asc');
        setSortColumn(column.sortKey);
      }
    },
    [sortColumn, sortDirection]
  );

  const sortedItems = useMemo(() => {
    if (!items) return [];
    if (!sortColumn) return items;
    return [...items].sort((a: any, b: any) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      return aValue < bValue
        ? sortDirection === 'asc'
          ? -1
          : 1
        : sortDirection === 'asc'
        ? 1
        : -1;
    });
  }, [items, sortColumn, sortDirection]);

  const renderItem = useCallback(
    (itemToRender: T, index: number) => (
      <TableRow key={index}>
        {columns.map((column, colIndex) => {
          const cellContent = column.render(itemToRender);
          return (
            <StyledTableCell key={colIndex}>
              {cellContent !== undefined && cellContent !== null ? cellContent : ''}
            </StyledTableCell>
          );
        })}
        <StyledTableCell>
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
        </StyledTableCell>
      </TableRow>
    ),
    [columns, onView, onInteraction, viewTooltip, interactionTooltip]
  );

  return (
    <TableContainer component={Paper}>
      <Table>
        {showHeaders && (
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <StyledTableCell key={index}>
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
                </StyledTableCell>
              ))}
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {item
            ? renderItem(item, 0)
            : sortedItems.map((itemToRender, index) => renderItem(itemToRender, index))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default EnhancedTableView;
