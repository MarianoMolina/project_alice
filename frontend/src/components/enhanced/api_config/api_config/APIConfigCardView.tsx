import React from 'react';
import { Typography } from '@mui/material';
import { Category, Description, HealthAndSafety, DataObject, QueryBuilder } from '@mui/icons-material';
import { APIConfigComponentProps } from '../../../../types/ApiConfigTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import { ApiName } from '../../../../types/ApiTypes';
import { apiNameIcons } from '../../../../utils/ApiUtils';

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
            icon: apiNameIcons[item.api_name as ApiName] || <Category />,
            primary_text: "API Name",
            secondary_text: item.api_name
        },
        {
            icon: <HealthAndSafety />,
            primary_text: "Health Status",
            secondary_text: item.health_status || 'Unknown'
        },
        {
            icon: <DataObject />,
            primary_text: "Configuration Data",
            secondary_text: <CodeBlock code={JSON.stringify(item.data, null, 2)} language='json'/>
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toDateString()
        },
    ];

    return (
        <CommonCardView
            elementType='API Config'
            title={item.name ?? ''}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='apiconfigs'
        />
    );
};

export default APIConfigCardView;