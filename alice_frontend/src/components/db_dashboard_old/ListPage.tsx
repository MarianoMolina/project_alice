import React, { useEffect, useState } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Button, Snackbar, TableSortLabel, Box } from '@mui/material';
import ModalComponent from './ModalComponent';
import { createItem, updateItem, fetchItem, fetchSchema } from '../../services/api';
import AddIcon from '@mui/icons-material/Add';
import useStyles from '../../styles/ListPageStyles';

interface ListPageProps {
  collectionName: string;
}

const ListPage: React.FC<ListPageProps> = ({ collectionName }) => {
  const classes = useStyles();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'view' | 'new' | 'edit'>('view');
  const [schema, setSchema] = useState<any>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string>('');

  useEffect(() => {
    console.log(`Component mounted. Fetching data for collection: ${collectionName}`);
    
    const fetchData = async () => {
      try {
        console.log(`Fetching data for ${collectionName}`);
        const result = await fetchItem(collectionName);
        console.log(`Data fetched for ${collectionName}:`, result);
        setData(result);
      } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionName]);

  const handleOpenModal = async (item: any, mode: 'view' | 'new' | 'edit') => {
    try {
      const schema = await fetchSchema(collectionName);
      console.log(`Fetched schema for ${mode === 'new' ? 'new item' : 'existing item'}:`, schema);
      setSchema(schema);
      setSelectedItem(mode === 'new' ? {} : item);
      setModalMode(mode);
      setModalOpen(true);
    } catch (error) {
      console.error('Error fetching schema:', error);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
    setSchema(null);
  };

  const handleSubmit = async (formData: any) => {
    try {
      let result;
      if (formData._id) {
        result = await updateItem(collectionName, formData._id, formData);
        setSnackbarMessage(`${collectionName} item ${formData._id} updated successfully`);
      } else {
        result = await createItem(collectionName, formData);
        setSnackbarMessage(`${collectionName} item ${result["_id"]} created successfully`);
      }
    } catch (e) {
      if (e instanceof Error) {
        setSnackbarMessage(`Error: ${e.message}`);
      } else {
        setSnackbarMessage('An unknown error occurred');
      }
    } finally {
      setSnackbarOpen(true);
      handleCloseModal();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortData = (array: any[], comparator: (a: any, b: any) => number) => {
    const stabilizedArray = array.map((el, index) => [el, index] as [any, number]);
    stabilizedArray.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedArray.map((el) => el[0]);
  };

  const getComparator = (order: 'asc' | 'desc', orderBy: string) => {
    return order === 'desc'
      ? (a: any, b: any) => (b[orderBy] < a[orderBy] ? -1 : 1)
      : (a: any, b: any) => (a[orderBy] < b[orderBy] ? -1 : 1);
  };

  if (loading) {
    console.log(`Loading data for ${collectionName}`);
    return (
      <Box className={classes.circularProgressContainer}>
        <CircularProgress />
      </Box>
    );
  }

  console.log(`Rendering data for ${collectionName}:`, data);

  const renderCellContent = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  };

  return (
    <Box className={classes.container}>
      <Box className={classes.titleButtonContainer}>
        <Typography variant="h4" component="h1">
          {collectionName}
        </Typography>
        <Button onClick={() => handleOpenModal({}, 'new')} variant="contained" color="primary" startIcon={<AddIcon />}>
          New
        </Button>
      </Box>
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {data.length > 0 &&
                Object.keys(data[0]).map((key) => (
                  <TableCell key={key}>
                    <TableSortLabel
                      active={orderBy === key}
                      direction={orderBy === key ? order : 'asc'}
                      onClick={() => handleRequestSort(key)}
                    >
                      {key}
                    </TableSortLabel>
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortData(data, getComparator(order, orderBy)).map((item, index) => (
              <TableRow key={index} onClick={() => handleOpenModal(item, 'edit')}>
                {Object.keys(item).map((key) => (
                  <TableCell key={key}>{renderCellContent(item[key])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {selectedItem && schema && (
        <ModalComponent
          open={modalOpen}
          handleClose={handleCloseModal}
          data={selectedItem}
          mode={modalMode}
          handleSubmit={handleSubmit}
          collectionName={collectionName}
          schema={schema}
        />
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        action={
          <Button color="inherit" size="small" onClick={handleCloseSnackbar}>
            Close
          </Button>
        }
      />
    </Box>
  );
};

export default ListPage;