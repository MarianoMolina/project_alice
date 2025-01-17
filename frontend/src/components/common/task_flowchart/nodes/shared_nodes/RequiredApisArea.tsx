import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { ApiType } from "../../../../../types/ApiTypes";
import React from "react";
import { apiTypeIcons } from "../../../../../utils/ApiUtils";
import theme from "../../../../../Theme";

export const RequiredApis: React.FC<{ apis: ApiType[] }> = ({ apis }) => {
    if (apis.length === 0) return null;
  
    return (
      <Stack spacing={0.5} alignItems="center">
        <Typography variant="caption" color={theme.palette.secondary.contrastText} fontWeight={'bold'}>
          Required APIs
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center">
          {apis.map((api) => (
            <Tooltip key={api} title={`${api}`} arrow>
              <Box sx={{ color: theme.palette.primary.dark }}>
                {React.cloneElement(apiTypeIcons[api as ApiType], {
                  sx: { width: 20, height: 20 }
                })}
              </Box>
            </Tooltip>
          ))}
        </Stack>
      </Stack>
    );
  };