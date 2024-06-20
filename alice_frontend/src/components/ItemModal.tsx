import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button, TextField, Typography, Paper } from '@mui/material';
import axios from 'axios';

interface Item {
  _id?: string;
  name: string;
  description: string;
}

interface ItemModalProps {
  item?: Item;
  onClose: () => void;
  createUrl?: string;
  fetchItems?: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, onClose, createUrl, fetchItems }) => {
  const [formData, setFormData] = useState<Item>(item || { name: '', description: '' });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (createUrl) {
        await axios.post(createUrl, formData);
        if (fetchItems) {
          fetchItems();
        }
      } else if (item?._id) {
        // Update item logic here
        await axios.put(`/api/${item._id}`, formData); // Adjust the URL as per your API
      }
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  return (
    <Paper sx={{ p: 4, width: '400px', maxWidth: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {item ? 'Item Details' : 'Create New Item'}
      </Typography>
      <TextField
        name="name"
        label="Name"
        value={formData.name || ''}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        name="description"
        label="Description"
        value={formData.description || ''}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
        {item ? 'Save' : 'Create'}
      </Button>
    </Paper>
  );
};

export default ItemModal;
