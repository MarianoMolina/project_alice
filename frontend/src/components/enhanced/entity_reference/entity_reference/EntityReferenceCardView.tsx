import React from 'react';
import {
    Typography,
    Link,
    Box,
    Chip,
    Stack,
    Avatar,
} from '@mui/material';
import { 
    Language, 
    Description, 
    QueryBuilder, 
    DataObject, 
    Source, 
    Category,
    Image,
    Cable,
} from '@mui/icons-material';
import { EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import { referenceCategoryToIcon } from '../../../../utils/EntityReferenceUtils';
import { apiTypeIcons } from '../../../../utils/ApiUtils';

const EntityReferenceCardView: React.FC<EntityReferenceComponentProps> = ({
    item
}) => {
    if (!item) {
        return <Typography>No Entity Reference data available.</Typography>;
    }

    const renderCategories = () => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {item.categories?.map((category) => {
                const Icon = referenceCategoryToIcon[category];
                return (
                    <Chip
                        key={category}
                        icon={<Icon />}
                        label={category}
                        size="small"
                    />
                );
            })}
        </Box>
    );

    const renderImages = () => (
        <Stack spacing={1}>
            {item.images.map((image, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={image.url} alt={image.alt}>
                        <Image />
                    </Avatar>
                    <Box>
                        <Link href={image.url} target="_blank" rel="noopener noreferrer">
                            {image.url}
                        </Link>
                        {image.caption && (
                            <Typography variant="caption" display="block">
                                {image.caption}
                            </Typography>
                        )}
                    </Box>
                </Box>
            ))}
        </Stack>
    );

    const renderConnections = () => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {item.connections.map((connection) => (
                <Chip
                    key={connection.entity_id}
                    label={`${connection.entity_id} (${connection.similarity_score.toFixed(2)})`}
                    size="small"
                />
            ))}
        </Box>
    );

    const listItems = [
        {
            icon: <Source />,
            primary_text: "Source ID",
            secondary_text: item.source_id
        },
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
            icon: <DataObject />,
            primary_text: "Description",
            secondary_text: <AliceMarkdown showCopyButton children={item.description ?? ''} />
        },
        {
            icon: <Description />,
            primary_text: "Content",
            secondary_text: <AliceMarkdown showCopyButton children={item.content ?? ''} />
        },
        {
            icon: <Category />,
            primary_text: "Categories",
            secondary_text: renderCategories()
        },
        {
            icon: <Image />,
            primary_text: "Images",
            secondary_text: renderImages()
        },
        {
            icon: item.source ? apiTypeIcons[item.source] : <Source />,
            primary_text: "Source",
            secondary_text: item.source && (
                <Chip
                    icon={apiTypeIcons[item.source]}
                    label={item.source}
                    size="small"
                />
            )
        },
        {
            icon: <Cable />,
            primary_text: "Connections",
            secondary_text: renderConnections()
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
        {
            icon: <DataObject />,
            primary_text: "Metadata",
            secondary_text: <CodeBlock language="json" code={JSON.stringify(item.metadata, null, 2)} />
        }
    ].filter(item => item.secondary_text); // Only show items with content

    return (
        <CommonCardView
            elementType='Entity Reference'
            title={item.name ?? ''}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='entityreferences'
        />
    );
};

export default EntityReferenceCardView;