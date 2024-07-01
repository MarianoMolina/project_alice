import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { TaskResponse } from '../../utils/types';

interface TaskResultSummaryTableProps {
  taskResults: TaskResponse[];
  onTaskResultClick: (result: TaskResponse) => void;
}

const TaskResultSummaryTable: React.FC<TaskResultSummaryTableProps> = ({ taskResults, onTaskResultClick }) => {
  const [selectedTask, setSelectedTask] = useState<string>('Any task');

  const taskOptions = useMemo(() => {
    const options = new Set(taskResults.map(result => result.task_name));
    return ['Any task', ...Array.from(options)];
  }, [taskResults]);

  const filteredResults = useMemo(() => {
    if (selectedTask === 'Any task') {
      return taskResults;
    }
    return taskResults.filter(result => result.task_name === selectedTask);
  }, [taskResults, selectedTask]);

  return (
    <>
      <FormControl fullWidth margin="normal">
        <InputLabel>Filter by Task</InputLabel>
        <Select
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value as string)}
        >
          {taskOptions.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task Name</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResults.map((result) => (
              <TableRow
                key={result._id}
                onClick={() => onTaskResultClick(result)}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>{result.task_name}</TableCell>
                <TableCell>{result.createdAt ? new Date(result.createdAt).toLocaleString() : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default TaskResultSummaryTable;