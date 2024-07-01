import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TableSortLabel,
} from '@mui/material';
import { TaskResponse } from '../../utils/types';
import useStyles from '../../styles/TaskResultTableStyles';

interface TaskResultTableProps {
    taskResults: TaskResponse[];
    setSelectedResult: (result: TaskResponse) => void;
}

type SortColumn = 'task_name' | 'result_code' | 'createdAt';

const TaskResultTable: React.FC<TaskResultTableProps> = ({ taskResults, setSelectedResult }) => {
    const classes = useStyles();
    const [orderBy, setOrderBy] = useState<SortColumn>('createdAt');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const handleRequestSort = (property: SortColumn) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedTaskResults = React.useMemo(() => {
        const comparator = (a: TaskResponse, b: TaskResponse) => {
            if (orderBy === 'createdAt') {
                return (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) * (order === 'asc' ? 1 : -1);
            }
            if (a[orderBy] < b[orderBy]) {
                return order === 'asc' ? -1 : 1;
            }
            if (a[orderBy] > b[orderBy]) {
                return order === 'asc' ? 1 : -1;
            }
            return 0;
        };

        return [...taskResults].sort(comparator);
    }, [taskResults, order, orderBy]);

    return (
        <TableContainer component={Paper} className={classes.taskResultsTable}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <TableSortLabel
                                active={orderBy === 'task_name'}
                                direction={orderBy === 'task_name' ? order : 'asc'}
                                onClick={() => handleRequestSort('task_name')}
                            >
                                Task Name
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={orderBy === 'result_code'}
                                direction={orderBy === 'result_code' ? order : 'asc'}
                                onClick={() => handleRequestSort('result_code')}
                            >
                                Result Code
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>
                            <TableSortLabel
                                active={orderBy === 'createdAt'}
                                direction={orderBy === 'createdAt' ? order : 'asc'}
                                onClick={() => handleRequestSort('createdAt')}
                            >
                                Created At
                            </TableSortLabel>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedTaskResults.map((result) => (
                        <TableRow
                            key={result._id}
                            onClick={() => setSelectedResult(result)}
                            className={classes.tableRow}
                        >
                            <TableCell>{result.task_name}</TableCell>
                            <TableCell>{result.result_code}</TableCell>
                            <TableCell>{result.createdAt ? new Date(result.createdAt).toLocaleString() : 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TaskResultTable;