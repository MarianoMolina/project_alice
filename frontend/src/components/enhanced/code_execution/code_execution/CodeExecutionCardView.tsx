import React from 'react';
import { Typography } from '@mui/material';
import { Category, TypeSpecimen, Description } from '@mui/icons-material';
import { CodeExecutionComponentProps } from '../../../../types/CodeExecutionTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';

const CodeExecutionCardView: React.FC<CodeExecutionComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No CodeExecution data available.</Typography>;
    }

    let listItems = [
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
    if (item.code_output && item.code_output.output) {
        listItems.push({
            icon: <TypeSpecimen />,
            primary_text: "Output",
            secondary_text: <CodeBlock language='bash' code={item.code_output.output}/>
        });
        if (item.code_output.exit_code) {
            listItems.push({
                icon: <Category />,
                primary_text: "Exit Code",
                secondary_text: item.code_output.exit_code.toString()
            });
        }
    }

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