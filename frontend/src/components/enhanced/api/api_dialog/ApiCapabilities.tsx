import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { API_CAPABILITIES, apiNameIcons, apiTypeIcons } from '../../../../utils/ApiUtils';
import { ApiName, ApiType } from '../../../../types/ApiTypes';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { cn } from '../../../../utils/cn';
import { BentoGrid, BentoGridItem } from '../../../ui/aceternity/BentoGrid';

interface APICapabilitiesProps {
  apiName?: ApiName;
}

const APICapabilities: React.FC<APICapabilitiesProps> = ({
  apiName,
}) => {
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<ApiType>>(new Set());

  // Get unique capabilities across all APIs
  const allCapabilities = useMemo(() => {
    const capabilities = new Set<ApiType>();
    Object.values(API_CAPABILITIES).forEach(apiCapabilities => {
      apiCapabilities.forEach(capability => capabilities.add(capability));
    });
    return Array.from(capabilities);
  }, []);

  // Filter APIs based on selected capabilities
  const filteredApis = useMemo(() => {
    const apis = apiName ? [apiName] : Object.keys(API_CAPABILITIES) as ApiName[];
    if (selectedCapabilities.size === 0) return apis;

    return apis.filter(api =>
      Array.from(selectedCapabilities).every(capability =>
        API_CAPABILITIES[api].has(capability)
      )
    );
  }, [apiName, selectedCapabilities]);

  const toggleCapability = (capability: ApiType) => {
    const newCapabilities = new Set(selectedCapabilities);
    if (newCapabilities.has(capability)) {
      newCapabilities.delete(capability);
    } else {
      newCapabilities.add(capability);
    }
    setSelectedCapabilities(newCapabilities);
  };

  return (
    <>
      {/* Explanation Section */}
      <Box className="mb-6 space-y-4">
        <Typography variant="body1">
          Project Alice uses third-party APIs to power its functionality. Each API provider can offer one or more capabilities.
        </Typography>

        <Alert severity="info" className="mb-4">
          <Typography variant="body2">
            <strong>Key Points:</strong>
            <ul className="list-disc pl-4 mt-2">
              <li>API Configs (including API keys) are shared across capabilities for each provider</li>
              <li>Tasks may require specific capabilities but can use any compatible provider</li>
              <li>If a task's preferred API is unavailable, it will use any available alternative with the required capability</li>
            </ul>
          </Typography>
        </Alert>

        {/* Capability Filter Section */}
        <Box className="mb-4">
          <Typography variant="subtitle1" className="mb-2 flex items-center gap-2">
            <FilterListIcon /> Filter API providers by Capabilities
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {allCapabilities.map((capability) => (
              <Tooltip
                key={capability}
                title={`Filter APIs with ${formatCamelCaseString(capability)} capability`}
                arrow
              >
                <Chip
                  icon={apiTypeIcons[capability]}
                  label={formatCamelCaseString(capability)}
                  onClick={() => toggleCapability(capability)}
                  color={selectedCapabilities.has(capability) ? "primary" : "default"}
                  variant={selectedCapabilities.has(capability) ? "filled" : "outlined"}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      </Box>

      {/* API Grid */}
      <BentoGrid className="max-w-6xl mx-auto" height={9}>
        {filteredApis.map((api) => (
          <BentoGridItem
            key={api}
            title={formatCamelCaseString(api)}
            description={`${API_CAPABILITIES[api].size} ${API_CAPABILITIES[api].size === 1 ? 'capability' : 'capabilities'}`}
            background='bg-slate-600/75'
            textColor='text-neutral-200'
            header={
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Array.from(API_CAPABILITIES[api]).map((capability) => (
                  <Tooltip
                    key={capability}
                    title={formatCamelCaseString(capability)}
                    arrow
                  >
                    <Chip
                      icon={apiTypeIcons[capability]}
                      label={capability.split('_').slice(-1)[0].toLowerCase()}
                      size="medium"
                      variant="outlined"
                      color={selectedCapabilities.has(capability) ? "primary" : "default"}
                    />
                  </Tooltip>
                ))}
              </Box>
            }
            className={cn("[&>p:text-lg]", "md:col-span-2")}
            icon={apiNameIcons[api]}
          />
        ))}
      </BentoGrid>
    </>
  );
};

export default APICapabilities;