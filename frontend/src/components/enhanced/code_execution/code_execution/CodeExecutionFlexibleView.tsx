import React, { useCallback, useEffect, useState } from 'react';
import {
    Typography,
    TextField,
    Box,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Chip,
} from '@mui/material';
import { CodeExecutionComponentProps, CodeExecution, getDefaultCodeExecutionForm, LANGUAGES, CodeBlock, CodeOutput } from '../../../../types/CodeExecutionTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import useStyles from '../CodeExecutionStyles';
import { CodeBlock as MarkdownCodeBlock } from '../../../ui/markdown/CodeBlock';
import { Check, Error } from '@mui/icons-material';
import { SelectInput } from '../../common/inputs/SelectInput';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { TextInput } from '../../common/inputs/TextInput';
import { NumericInput } from '../../common/inputs/NumericInput';


const CodeExecutionFlexibleView: React.FC<CodeExecutionComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();
    const isEditMode = mode === 'edit' || mode === 'create';
    const [form, setForm] = useState<Partial<CodeExecution>>(item || getDefaultCodeExecutionForm());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (item && Object.keys(item).length !== 0) {
            setForm(item);
        }
    }, [item]);

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultCodeExecutionForm());
        }
    }, [item, onChange]);
   
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);
    
    const handleLocalSave = useCallback(async () => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);

    const handleFieldChange = useCallback((field: keyof CodeExecution, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
    }, []);

    const handleCodeChange = (value: string | undefined) => {
        if (!value) {
            return;
        }
        const newCodeBlock: CodeBlock = {
            code: value,
            language: item?.code_block?.language || 'text' // Provide default language
        };
        
        handleFieldChange('code_block', newCodeBlock);
    };

    const handleLanguageChange = (value: string | string[] | undefined) => {
        if (!value) {
            return;
        }
        if (Array.isArray(value)) {
            value = value[0];
        }
        const newCodeBlock: CodeBlock = {
            code: item?.code_block?.code || '',
            language: value
        };

        handleFieldChange('code_block', newCodeBlock);
    };

    const handleOutputChange = (value: string | undefined) => {
        if (!value) {
            return
        }
        const newOutput: CodeOutput = {
            output: value,
            exit_code: item?.code_output?.exit_code || 0
        };

        handleFieldChange('code_output', newOutput);
    };

    const handleExitCodeChange = (value: string | number | undefined) => {
        if (!value) {
            return
        }
        if (typeof value === 'string' && value.trim() === '') {
            return;
        }
        if (typeof value === 'number' && isNaN(value)) {
            return;
        }
        if (typeof value === 'string' ) {
            value = parseInt(value);
        }
        const exitCode = value || 0;
        const newOutput: CodeOutput = {
            output: item?.code_output?.output || '',
            exit_code: exitCode
        };

        handleFieldChange('code_output', newOutput);
    };

    const title = mode === 'create' ? 'Create New Code Execution' : mode === 'edit' ? 'Edit Code Execution' : 'Code Execution Details';
    const saveButtonText = item?._id ? 'Update Code Execution' : 'Create Code Execution';

    return (
        <GenericFlexibleView
            elementType='Code Execution'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as CodeExecution}
            itemType='codeexecutions'
        >
            <SelectInput
                name='type'
                label='Type'
                value={item?.code_block.language || 'text'}
                onChange={(value) => handleLanguageChange(value)}
                description='Type is always code.'
                options={LANGUAGES.map((lang) => ({
                    value: lang,
                    label: formatCamelCaseString(lang)
                }))
                }
            />
            <TextInput
                name='code'
                label='Code'
                value={item?.code_block.code || ''}
                onChange={(value) => handleCodeChange(value)}
                disabled={!isEditMode}
                description='Enter the code to be executed'
                multiline
                rows={5}
            />

            <TextInput
                name='output'
                label='Output'
                value={item?.code_output.output || ''}
                onChange={(value) => handleOutputChange(value)}
                disabled={!isEditMode}
                description='Enter the output of the code execution'
                multiline
                rows={3}
            />

            <NumericInput
                name='exit_code'
                label='Exit Code'
                value={item?.code_output.exit_code || 0}
                onChange={(value) => handleExitCodeChange(value)}
                disabled={!isEditMode}
                description='Enter the exit code of the code execution'
            />
        </GenericFlexibleView>
    );
};

export default CodeExecutionFlexibleView;