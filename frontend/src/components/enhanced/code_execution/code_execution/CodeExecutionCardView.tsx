import React from 'react';
import { Typography } from '@mui/material';
import { Category, TypeSpecimen, Description } from '@mui/icons-material';
import { CodeExecutionComponentProps } from '../../../../types/CodeExecutionTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';

const CodeExecutionCardView: React.FC<CodeExecutionComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No CodeExecution data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Description />,
            primary_text: "Language",
            secondary_text: item.code_block.language
        },
        {
            icon: <TypeSpecimen />,
            primary_text: "Code",
            secondary_text: <CodeBlock language={item.code_block.language} code={item.code_block.code}/>
        },
        {
            icon: <Category />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toDateString()
        }
    ];

    return (
        <CommonCardView
            elementType='CodeExecution'
            title="CodeExecution"
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='codeexecutions'
        />
    );
};

export default CodeExecutionCardView;