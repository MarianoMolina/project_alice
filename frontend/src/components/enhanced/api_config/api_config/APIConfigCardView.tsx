import React from 'react';
import { Typography } from '@mui/material';
import { Category, TypeSpecimen, Description, HealthAndSafety, DataObject } from '@mui/icons-material';
import { APIConfigComponentProps } from '../../../../types/ApiConfigTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';

const APIConfigCardView: React.FC<APIConfigComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No APIConfig data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Description />,
            primary_text: "Name",
            secondary_text: item.name
        },
        {
            icon: <TypeSpecimen />,
            primary_text: "API Name",
            secondary_text: item.api_name
        },
        {
            icon: <HealthAndSafety />,
            primary_text: "Health Status",
            secondary_text: item.health_status
        },
        {
            icon: <Category />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toDateString()
        },
        {
            icon: <DataObject />,
            primary_text: "Data",
            secondary_text: <CodeBlock code={JSON.stringify(item.data, null, 2)} language='json'/>
        }
    ];

    return (
        <CommonCardView
            elementType='APIConfig'
            title="APIConfig"
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='apiconfigs'
        />
    );
};

export default APIConfigCardView;