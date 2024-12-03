import React from 'react';
import { Typography } from '@mui/material';
import { Category, TypeSpecimen, Description, Foundation } from '@mui/icons-material';
import { ParameterComponentProps } from '../../../../types/ParameterTypes';
import CommonCardView from '../../common/enhanced_component/CardView';

const ParameterCardView: React.FC<ParameterComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No parameter data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Description />,
            primary_text: "Description",
            secondary_text: item.description
        },
        {
            icon: <Foundation />,
            primary_text: "Default",
            secondary_text: `${item.default}` || 'No default value'
        },
        {
            icon: <TypeSpecimen />,
            primary_text: "Type",
            secondary_text: item.type
        },
        {
            icon: <Category />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toDateString()
        }
    ];

    return (
        <CommonCardView
            elementType='Parameter'
            title="Parameter"
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='parameters'
        />
    );
};

export default ParameterCardView;