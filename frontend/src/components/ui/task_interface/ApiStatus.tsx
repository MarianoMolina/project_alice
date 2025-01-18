import { memo, useCallback, useState } from "react";
import useStyles from '../../../styles/StartTaskStyles';
import { Box, IconButton, Typography } from "@mui/material";
import { Info } from "@mui/icons-material";
import EnhancedAPIConfig from "../../enhanced/api_config/api_config/EnhancedAPIConfig";
import APICapabilitiesDialog from "../../enhanced/api/ApiCapabilitiesDialog";
import { useDialog } from "../../../contexts/DialogContext";
import { APIConfig } from "../../../types/ApiConfigTypes";

export const APIStatusSection = memo(() => {
    const classes = useStyles();
    const { selectCardItem } = useDialog();
    const [showCapabilities, setShowCapabilities] = useState(false);

    const handleApiConfigInteraction = useCallback((apiConfig: APIConfig) => {
        if (apiConfig._id) selectCardItem('APIConfig', apiConfig._id);
    }, [selectCardItem]);

    return (
        <Box className={classes.apiStatusContainer}>
            <Typography variant="h6" className={classes.sectionTitle}>
                API Status
                <IconButton>
                    <Info onClick={() => setShowCapabilities(true)} />
                </IconButton>
            </Typography>
            <Box className={classes.apiTooltipContainer}>
                <EnhancedAPIConfig
                    mode="tooltip"
                    fetchAll={true}
                    onInteraction={handleApiConfigInteraction}
                />
            </Box>

            <APICapabilitiesDialog
                open={showCapabilities}
                onClose={() => setShowCapabilities(false)}
            />
        </Box >
    );
});