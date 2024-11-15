import React from 'react';
import {
    Typography,
    Link,
} from '@mui/material';
import { Language, Description, QueryBuilder, DataObject } from '@mui/icons-material';
import { EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';

const EntityReferenceCardView: React.FC<EntityReferenceComponentProps> = ({
    item
}) => {

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
            secondary_text: <AliceMarkdown showCopyButton children={item.content ?? ''} />
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
            title={item.name ?? ''}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='entityreferences'
        >
        </CommonCardView>
    );
};

export default EntityReferenceCardView;