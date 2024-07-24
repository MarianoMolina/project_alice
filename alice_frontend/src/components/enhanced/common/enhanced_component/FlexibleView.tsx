import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    styled
} from '@mui/material';

const FlexibleViewContainer = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
}));

const TitleContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
}));

const FormContainer = styled(Box)(({ theme }) => ({
    flexGrow: 1,
    marginBottom: theme.spacing(3),
}));

const ButtonContainer = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
});

interface GenericFlexibleViewProps {
    title: string;
    children: React.ReactNode;
    onSave?: () => void;
    saveButtonText?: string;
    isEditMode?: boolean;
}

const GenericFlexibleView: React.FC<GenericFlexibleViewProps> = ({
    title,
    children,
    onSave,
    saveButtonText = 'Save',
    isEditMode = false,
}) => {
    return (
        <FlexibleViewContainer>
            <TitleContainer>
                <Typography variant="h5">{title}</Typography>
            </TitleContainer>
            <FormContainer>
                {children}
            </FormContainer>
            {isEditMode && onSave && (
                <ButtonContainer>
                    <Button variant="contained" color="primary" onClick={onSave}>
                        {saveButtonText}
                    </Button>
                </ButtonContainer>
            )}
        </FlexibleViewContainer>
    );
};

export default GenericFlexibleView;