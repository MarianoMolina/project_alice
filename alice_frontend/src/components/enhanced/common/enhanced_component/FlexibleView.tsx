import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    styled
} from '@mui/material';
import { hexToRgba } from '../../../../utils/StyleUtils';

const FlexibleViewContainer = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
    backgroundColor: `${hexToRgba(theme.palette.background.paper, 0.7)} !important`,
}));

const TitleContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
    position: 'relative',
}));

const ElementTypeText = styled(Typography)(({ theme }) => ({
    position: 'absolute',
    top: -10,
    left: 8,
    fontSize: '0.75rem',
    padding: '0 4px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: 4,
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
    elementType?: string;
    children: React.ReactNode;
    onSave?: () => void;
    saveButtonText?: string;
    isEditMode?: boolean;
}

const GenericFlexibleView: React.FC<GenericFlexibleViewProps> = ({
    title,
    elementType,
    children,
    onSave,
    saveButtonText = 'Save',
    isEditMode = false,
}) => {
    return (
        <FlexibleViewContainer>
            <TitleContainer>
                {elementType && (
                    <ElementTypeText variant="caption" color="inherit">
                        {elementType}
                    </ElementTypeText>
                )}
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