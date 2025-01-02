import { Box, Typography } from "@mui/material";
import { CollectionName, CollectionPopulatedType } from "../../../../types/CollectionTypes";
import EntityActionsMenu from "../entity_menu/EntityActionsMenu";
import useStyles from "./EnhancedStyles";

interface CardTitleProps<T extends CollectionName> {
    title: string;
    elementType?: string;
    item?: CollectionPopulatedType[T];
    itemType?: T;
}

const CardTitle = <T extends CollectionName>({
    title,
    elementType,
    item,
    itemType
}: CardTitleProps<T>) => {
    const classes = useStyles();

    return (

        <Box className={classes.titleContainer}>
            {elementType && (
                <Typography variant="caption" className={classes.elementType}>
                    {elementType}
                </Typography>
            )}
            <Box className={classes.titleContent}>
                <Typography variant="h5" className={classes.title}>
                    {title}
                </Typography>
                {item && itemType && (
                    <Box className={classes.downloadButton}>
                        <EntityActionsMenu item={item} itemType={itemType} />
                    </Box>
                )}
            </Box>
        </Box>

    );
};

export default CardTitle;