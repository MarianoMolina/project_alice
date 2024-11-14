import React from 'react';
import { Typography } from '@mui/material';
import { Category, TypeSpecimen, Description } from '@mui/icons-material';
import { ToolCallComponentProps } from '../../../../types/ToolCallTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';

const ToolCallCardView: React.FC<ToolCallComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No ToolCall data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Description />,
            primary_text: "Tool called",
            secondary_text: item.function?.name
        },
        {
            icon: <TypeSpecimen />,
            primary_text: "Args",
            secondary_text: <CodeBlock language='json' code={item.function?.arguments}/>
        },
        {
            icon: <Category />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toDateString()
        }
    ];

    return (
        <CommonCardView
            elementType='ToolCall'
            title="ToolCall"
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='toolcalls'
        />
    );
};

export default ToolCallCardView;