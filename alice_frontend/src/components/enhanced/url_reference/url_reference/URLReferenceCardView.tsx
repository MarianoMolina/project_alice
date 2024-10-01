import React from 'react';
import {
    Typography,
    Chip,
    Link,
    Box
} from '@mui/material';
import { Language, Description, QueryBuilder } from '@mui/icons-material';
import { URLReferenceComponentProps } from '../../../../types/URLReferenceTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import useStyles from '../URLReferenceStyles';

const URLReferenceCardView: React.FC<URLReferenceComponentProps> = ({
    item
}) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No URL Reference data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Language />,
            primary_text: "URL",
            secondary_text: (
                <Link href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.url}
                </Link>
            )
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
        {
            icon: <Description />,
            primary_text: "Content",
            secondary_text: (
                <Typography variant="body2" className={classes.urlReferenceContent}>
                    {item.content.substring(0, 100)}...
                </Typography>
            )
        }
    ];

    return (
        <CommonCardView
            elementType='URL Reference'
            title={item.title}
            id={item._id}
            listItems={listItems}
        >
            <Box mt={2}>
                <Typography variant="subtitle1" gutterBottom>Metadata</Typography>
                {Object.entries(item.metadata || {}).map(([key, value]) => (
                    <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        className={classes.metadataChip}
                    />
                ))}
            </Box>
        </CommonCardView>
    );
};

export default URLReferenceCardView;