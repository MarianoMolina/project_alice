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
import { EntityReferenceComponentProps, PopulatedEntityReference } from '../../../../types/EntityReferenceTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import { referenceCategoryToIcon } from '../../../../utils/EntityReferenceUtils';
import { apiTypeIcons } from '../../../../utils/ApiUtils';
import EmbeddingChunkViewer from '../../embedding_chunk/embedding_chunk/EmbeddingChunkViewer';

const EntityReferenceCardView: React.FC<EntityReferenceComponentProps> = ({
    item
}) => {
    if (!item) {
        return <Typography>No Entity Reference data available.</Typography>;
    }

    const populatedItem = item as PopulatedEntityReference;

    const renderCategories = () => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {populatedItem.categories?.map((category) => {
                const Icon = referenceCategoryToIcon[category];
                return (
                    <Chip
                        key={category}
                        icon={Icon}
                        label={category}
                        size="small"
                    />
                );
            })}
        </Box>
    );

    const renderImages = () => (
        <Stack spacing={1}>
            {populatedItem.images.map((image, index) => (
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
            {populatedItem.connections.map((connection) => (
                <Chip
                    key={connection.entity_id}
                    label={`${connection.entity_id} (${connection.similarity_score.toFixed(2)})`}
                    size="small"
                />
            ))}
        </Box>
    );

    const embeddingChunkViewer = populatedItem.embedding && populatedItem.embedding?.length > 0 ?
     populatedItem.embedding.map((chunk, index) => (
        <EmbeddingChunkViewer
            key={chunk._id || `embedding-${index}`}
            item={chunk}
            items={null} onChange={()=>null} mode={'view'} handleSave={async()=>{}}
        />
    )) : <Typography>No embeddings available</Typography>;

    const listItems = [
        {
            icon: <Source />,
            primary_text: "Source ID",
            secondary_text: populatedItem.source_id
        },
        {
            icon: populatedItem.source ? apiTypeIcons[populatedItem.source] : <Source />,
            primary_text: "Source",
            secondary_text: populatedItem.source && (
                <Chip
                    icon={apiTypeIcons[populatedItem.source]}
                    label={populatedItem.source}
                    size="small"
                />
            )
        },
        {
            icon: <Category />,
            primary_text: "Categories",
            secondary_text: renderCategories()
        },
        {
            icon: <Language />,
            primary_text: "URL",
            secondary_text: (
                <Link href={populatedItem.url} target="_blank" rel="noopener noreferrer">
                    {populatedItem.url}
                </Link>
            )
        },
        {
            icon: <DataObject />,
            primary_text: "Description",
            secondary_text: populatedItem.description ? <AliceMarkdown showCopyButton children={populatedItem.description} /> : 'N/A'
        },
        {
            icon: <Description />,
            primary_text: "Content",
            secondary_text: populatedItem.content ? <AliceMarkdown showCopyButton children={populatedItem.content} /> : 'N/A'
        },
        {
            icon: <Image />,
            primary_text: "Images",
            secondary_text: renderImages()
        },
        {
            icon: <Cable />,
            primary_text: "Connections",
            secondary_text: renderConnections()
        },
        {
            icon: <DataObject />,
            primary_text: "Embedding",
            secondary_text: embeddingChunkViewer
        },
        {
            icon: <DataObject />,
            primary_text: "Metadata",
            secondary_text: <CodeBlock language="json" code={JSON.stringify(populatedItem.metadata, null, 2)} />
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(populatedItem.createdAt || '').toLocaleString()
        }
    ].filter(item => item.secondary_text); // Only show items with content

    return (
        <CommonCardView
            elementType='Entity Reference'
            title={populatedItem.name ?? ''}
            id={populatedItem._id}
            listItems={listItems}
            item={item as PopulatedEntityReference}
            itemType='entityreferences'
        />
    );
};

export default EntityReferenceCardView;