import React from 'react';
import { Modal, IconButton, Typography, Box } from '@mui/material';
import Form from '@rjsf/mui';
import { IChangeEvent } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import CloseIcon from '@mui/icons-material/Close';
import useStyles from './ModalComponentStyles';

interface ModalComponentProps {
  open: boolean;
  handleClose: () => void;
  data: Record<string, any> | null;
  mode: 'view' | 'new' | 'edit';
  handleSubmit: (formData: Record<string, any>) => void;
  collectionName: string;
  schema: Record<string, any> | null;
}

const ModalComponent: React.FC<ModalComponentProps> = ({
  open,
  handleClose,
  data,
  mode,
  handleSubmit,
  collectionName,
  schema,
}) => {
  const classes = useStyles();

  if (!data || !schema) {
    console.error('Data or schema is null:', data, schema);
    return null;
  }

  console.log('Modal mode:', mode, 'Data:', data, 'Schema:', schema);

  const onSubmit = ({ formData }: IChangeEvent<any>) => {
    handleSubmit(formData);
  };

  const uiSchema = {
    _id: {
      'ui:disabled': true,
    },
    __v: {
      'ui:widget': 'hidden',
    },
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box className={classes.modalContent}>
        <Box className={classes.modalHeader}>
          <Typography variant="h6">
            {mode === 'new' ? `Add New ${collectionName}` : `Viewing ${collectionName} element ${data.name || data._id}`}
          </Typography>
          <IconButton onClick={handleClose} className={classes.closeButton}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box className={classes.modalBody}>
          <Form
            schema={schema}
            validator={validator}
            formData={data}
            disabled={mode === 'view'}
            onSubmit={mode === 'view' ? undefined : onSubmit}
            uiSchema={uiSchema}
            className={classes.form}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalComponent;