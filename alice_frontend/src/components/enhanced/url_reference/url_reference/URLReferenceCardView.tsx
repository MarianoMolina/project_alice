import React from 'react';
import {
    Typography,
    Link,
} from '@mui/material';
import { Language, Description, QueryBuilder, DataObject } from '@mui/icons-material';
import { URLReferenceComponentProps } from '../../../../types/URLReferenceTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import useStyles from '../URLReferenceStyles';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';

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
        },
        {
            icon: <DataObject />,
            primary_text: "Metadata",
            secondary_text: <CodeBlock language="json" code={JSON.stringify(item.metadata, null, 2)} />
        }
    ];

    return (
        <CommonCardView
            elementType='URL Reference'
            title={item.title}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='urlreferences'
        >
        </CommonCardView>
    );
};

export default URLReferenceCardView;