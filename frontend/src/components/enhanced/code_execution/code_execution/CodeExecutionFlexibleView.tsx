import React, { useCallback, useEffect } from 'react';
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


const CodeExecutionFlexibleView: React.FC<CodeExecutionComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();
    const isEditMode = mode === 'edit' || mode === 'create';

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultCodeExecutionForm());
        }
        Logger.debug('CodeExecutionFlexibleView', 'item', item);
        Logger.debug('CodeExecutionFlexibleView', getDefaultCodeExecutionForm());
    }, [item, onChange]);
   
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const handleCodeChange = (value: string) => {
        const newCodeBlock: CodeBlock = {
            code: value,
            language: item?.code_block?.language || 'text' // Provide default language
        };
        
        onChange({
            code_block: newCodeBlock
        });
    };

    const handleLanguageChange = (value: string) => {
        const newCodeBlock: CodeBlock = {
            code: item?.code_block?.code || '',
            language: value
        };

        onChange({
            code_block: newCodeBlock
        });
    };

    const handleOutputChange = (value: string) => {
        const newOutput: CodeOutput = {
            output: value,
            exit_code: item?.code_output?.exit_code || 0
        };

        onChange({
            code_output: newOutput
        });
    };

    const handleExitCodeChange = (value: string) => {
        const exitCode = parseInt(value) || 0;
        const newOutput: CodeOutput = {
            output: item?.code_output?.output || '',
            exit_code: exitCode
        };

        onChange({
            code_output: newOutput
        });
    };

    const title = mode === 'create' ? 'Create New Code Execution' : mode === 'edit' ? 'Edit Code Execution' : 'Code Execution Details';
    const saveButtonText = item?._id ? 'Update Code Execution' : 'Create Code Execution';

    return (
        <GenericFlexibleView
            elementType='Code Execution'
            title={title}
            onSave={handleSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as CodeExecution}
            itemType='codeexecutions'
        >
            <Box className={classes.section}>
                <Typography variant="h6" className={classes.sectionTitle}>Code Block</Typography>
                
                <FormControl fullWidth margin="normal">
                    <InputLabel id="language-select-label">Language</InputLabel>
                    <Select
                        labelId="language-select-label"
                        value={item?.code_block?.language || ''}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        disabled={!isEditMode}
                    >
                        {LANGUAGES.map((lang) => (
                            <MenuItem key={lang} value={lang}>
                                {lang.charAt(0).toUpperCase() + lang.slice(1)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {isEditMode ? (
                    <TextField
                        fullWidth
                        multiline
                        rows={8}
                        value={item?.code_block?.code || ''}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="Enter your code here..."
                        margin="normal"
                        className={classes.codeInput}
                    />
                ) : (
                    <Box className={classes.codeDisplay}>
                        <MarkdownCodeBlock
                            language={item?.code_block?.language || 'text'}
                            code={item?.code_block?.code || ''}
                        />
                    </Box>
                )}
            </Box>

            <Box className={classes.section}>
                <Typography variant="h6" className={classes.sectionTitle}>
                    Execution Output
                    {item?.code_output?.exit_code !== undefined && (
                        <Chip
                            icon={item.code_output.exit_code === 0 ? <Check /> : <Error />}
                            label={`Exit Code: ${item.code_output.exit_code}`}
                            color={item.code_output.exit_code === 0 ? "success" : "error"}
                            className={classes.exitCodeChip}
                        />
                    )}
                </Typography>

                {isEditMode ? (
                    <>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={item?.code_output?.output || ''}
                            onChange={(e) => handleOutputChange(e.target.value)}
                            placeholder="Execution output..."
                            margin="normal"
                        />
                        <TextField
                            type="number"
                            label="Exit Code"
                            value={item?.code_output?.exit_code || 0}
                            onChange={(e) => handleExitCodeChange(e.target.value)}
                            margin="normal"
                            className={classes.exitCodeInput}
                        />
                    </>
                ) : (
                    <Box className={classes.outputDisplay}>
                        <MarkdownCodeBlock
                            language="text"
                            code={item?.code_output?.output || ''}
                        />
                    </Box>
                )}
            </Box>
        </GenericFlexibleView>
    );
};

export default CodeExecutionFlexibleView;