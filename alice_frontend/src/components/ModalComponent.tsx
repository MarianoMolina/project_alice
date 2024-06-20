import React from 'react';
import { Modal, IconButton } from '@mui/material';
import Form from '@rjsf/mui';
import { IChangeEvent } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import CloseIcon from '@mui/icons-material/Close';
import './ModalComponent.css';

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
  if (!data || !schema) {
    console.error('Data or schema is null:', data, schema);
    return null; // Do not render the component if data or schema is null
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
      <div className="modal-content">
        <div className="modal-header">
          <h2>{mode === 'new' ? `Add New ${collectionName}` : `Viewing ${collectionName} element ${data.name || data._id}`}</h2>
          <IconButton onClick={handleClose} style={{ marginLeft: 'auto' }}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="modal-body">
          <Form
            schema={schema}
            validator={validator}
            formData={data}
            disabled={mode === 'view'}
            onSubmit={mode === 'view' ? undefined : onSubmit}
            uiSchema={uiSchema}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ModalComponent;
