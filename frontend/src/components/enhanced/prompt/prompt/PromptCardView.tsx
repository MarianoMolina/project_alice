import React from 'react';
import {
    Typography,
    Chip,
} from '@mui/material';
import { Code, Assignment, QueryBuilder, Settings } from '@mui/icons-material';
import { PromptComponentProps } from '../../../../types/PromptTypes';
import useStyles from '../PromptStyles';
import CommonCardView from '../../common/enhanced_component/CardView';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';

const PromptCardView: React.FC<PromptComponentProps> = ({
    item,
}) => {
    const classes = useStyles();
    const { selectCardItem, selectPromptParsedDialog } = useCardDialog();
    if (!item) {
        return <Typography>No prompt data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Code />,
            primary_text: "Content",
            secondary_text: (
                <AliceMarkdown showCopyButton>
                    {item.content}
                </AliceMarkdown>
            )
        },
        {
            icon: <Code />,
            primary_text: "Templated",
            secondary_text: item.is_templated ? (
                <Chip
                    label="Yes"
                    color="primary"
                    onClick={() => selectPromptParsedDialog(item)}
                />
            ) : 'No'
        },
        ...(item.parameters ? [{
            icon: <Settings />,
            primary_text: "Parameters",
            secondary_text: (
                <>
                    {Object.entries(item.parameters.properties).map(([key, param]) => (
                        <Chip
                            key={key}
                            label={`${key}: ${param.type}`}
                            onClick={() => selectCardItem && selectCardItem('Parameter', param._id!, param)}
                            className={classes.chip}
                            color={item.parameters?.required.includes(key) ? "primary" : "default"}
                        />
                    ))}
                </>
            )
        }] : []),
        ...(item.partial_variables && Object.keys(item.partial_variables).length > 0 ? [{
            icon: <Settings />,
            primary_text: "Partial Variables",
            secondary_text: (
                <>
                    {Object.keys(item.partial_variables).map((key) => (
                        <Chip
                            key={key}
                            label={key}
                            className={classes.chip}
                        />
                    ))}
                </>
            )
        }] : []),
        ...(item.version !== undefined ? [{
            icon: <Assignment />,
            primary_text: "Version",
            secondary_text: item.version.toString()
        }] : []),
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
    ];

    return (
        <CommonCardView
            elementType='Prompt'
            title={item.name}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='prompts'
        >
        </CommonCardView>
    );
};

export default PromptCardView;