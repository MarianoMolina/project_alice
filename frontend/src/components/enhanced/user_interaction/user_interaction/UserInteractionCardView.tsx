import React, { useState } from 'react';
import {
    Typography,
    Button,
} from '@mui/material';
import { Language, QueryBuilder, DataObject, Functions, QuestionAnswer } from '@mui/icons-material';
import { PopulatedUserInteraction, UserInteractionComponentProps } from '../../../../types/UserInteractionTypes';
import { useDialog } from '../../../../contexts/DialogCustomContext';
import { useApi } from '../../../../contexts/ApiContext';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import Logger from '../../../../utils/Logger';
import EmbeddingChunkViewer from '../../embedding_chunk/embedding_chunk/EmbeddingChunkViewer';
import { useCardDialog } from '../../../../contexts/CardDialogContext';

const UserInteractionCardView: React.FC<UserInteractionComponentProps> = ({
    item: initialItem
}) => {
    const [item, setItem] = useState(initialItem as PopulatedUserInteraction);
    const { openDialog } = useDialog();
    const { selectCardItem } = useCardDialog();
    const { updateUserInteraction } = useApi();

    if (!item) {
        return <Typography>No User Interaction data available.</Typography>;
    }

    const handleViewOwner = () => {
        if (item.owner && item.owner.type === 'task_response') {
            selectCardItem('TaskResponse', item.owner.id as string);
        } else if (item.owner && item.owner.type === 'chat') {
            selectCardItem('Chat', item.owner.id as string);
        }
    };

    const handleResponseClick = async () => {
        openDialog({
            title: 'User Interaction Required',
            content: item.user_checkpoint_id.user_prompt,
            buttons: Object.entries(item.user_checkpoint_id.options_obj).map(([key, value]) => ({
                text: value,
                action: async () => {
                    try {
                        const updatedInteraction = await updateUserInteraction(
                            item._id as string,
                            {
                                user_response: {
                                    selected_option: parseInt(key),
                                }
                            }
                        );
                        Logger.debug('User interaction updated:', updatedInteraction);
                        setItem(updatedInteraction as PopulatedUserInteraction);
                    } catch (error) {
                        Logger.error('Error handling user response:', error);
                    }
                },
                color: 'primary',
                variant: key === '0' ? 'contained' : 'outlined',
            })),
        });
    };

    const UserResponseContent = item.user_response ? (
        <CodeBlock language="json" code={JSON.stringify(item.user_response, null, 2)} />
    ) : (
        <Button
            startIcon={<QuestionAnswer />}
            onClick={handleResponseClick}
            variant="contained"
            size="small"
            sx={{ mt: 1 }}
        >
            Respond
        </Button>
    );
    const embeddingChunkViewer = item.embedding && item.embedding?.length > 0 ?
        item.embedding.map((chunk, index) => (
            <EmbeddingChunkViewer
                key={chunk._id || `embedding-${index}`}
                item={chunk}
                items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
        )) : <Typography>No embeddings available</Typography>;

    
    const ownerType = item.owner?.type === 'task_response' ? 'Task Response' : item.owner?.type === 'chat' ? 'Chat' : 'Unknown';
    const ownerComponent = item.owner ? (
        <Typography variant="body1" onClick={handleViewOwner} style={{ cursor: 'pointer' }}>
            {ownerType} - {item.owner.id}
        </Typography>
    ) : (
        <Typography variant="body1">No owner available</Typography>
    );
    const listItems = [
        {
            icon: <Language />,
            primary_text: "User Prompt",
            secondary_text: item.user_checkpoint_id.user_prompt || 'No user prompt available'
        },
        {
            icon: <Functions />,
            primary_text: "Owner",
            secondary_text: ownerComponent
        },
        {
            icon: <DataObject />,
            primary_text: "User Choice",
            secondary_text: UserResponseContent
        },
        {
            icon: <DataObject />,
            primary_text: "Embedding",
            secondary_text: embeddingChunkViewer
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
    ];

    return (
        <CommonCardView
            elementType='User Interaction'
            title={'User Interaction Details'}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='userinteractions'
        />
    );
};

export default UserInteractionCardView;