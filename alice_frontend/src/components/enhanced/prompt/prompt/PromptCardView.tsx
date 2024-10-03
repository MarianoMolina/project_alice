import React from 'react';
import {
    Typography,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import { Code, ExpandMore, Assignment, QueryBuilder, Settings } from '@mui/icons-material';
import { PromptComponentProps } from '../../../../types/PromptTypes';
import useStyles from '../PromptStyles';
import CommonCardView from '../../common/enhanced_component/CardView';
import CustomMarkdown from '../../common/markdown/customMarkdown2';

const PromptCardView: React.FC<PromptComponentProps> = ({
    item,
    handleParameterClick,
}) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No prompt data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Code />,
            primary_text: "Templated",
            secondary_text: item.is_templated ? 'Yes' : 'No'
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
        ...(item.version !== undefined ? [{
            icon: <Assignment />,
            primary_text: "Version",
            secondary_text: item.version.toString()
        }] : []),
        ...(item.parameters ? [{
            icon: <Settings />,
            primary_text: "Parameters",
            secondary_text: (
                <>
                    {Object.entries(item.parameters.properties).map(([key, param]) => (
                        <Chip
                            key={key}
                            label={`${key}: ${param.type}`}
                            onClick={() => handleParameterClick && handleParameterClick(param._id!)}
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
        }] : [])
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
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="prompt-content"
                    id="prompt-content-header"
                >
                    <Typography>Prompt Content</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <CustomMarkdown className={`${classes.messageSmall} ${classes.assistantMessage}`}>
                        {item.content}
                    </CustomMarkdown>
                </AccordionDetails>
            </Accordion>
        </CommonCardView>
    );
};

export default PromptCardView;