import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Typography, Box, AccordionSummary, Accordion, AccordionDetails, Divider } from '@mui/material';
import nunjucks from 'nunjucks';
import { Prompt } from '../../../types/PromptTypes';
import AliceMarkdown, { RoleType } from '../../ui/markdown/alice_markdown/AliceMarkdown';
import { ExpandMore } from '@mui/icons-material';
import ParameterInputFields from '../parameter/ParameterInputFields';

interface PromptParsedViewProps {
  prompt: Prompt;
  systemPrompt?: Prompt;
  initialInputs?: Record<string, any>;
  initialSystemInputs?: Record<string, any>;
  onChange?: (inputs: Record<string, any>) => void;
  onSystemChange?: (inputs: Record<string, any>) => void;
}

const PromptParsedView = ({ 
  prompt, 
  systemPrompt, 
  initialInputs = {}, 
  initialSystemInputs = {},
  onChange,
  onSystemChange 
}: PromptParsedViewProps) => {
  const [inputs, setInputs] = useState<Record<string, any>>(initialInputs);
  const [systemInputs, setSystemInputs] = useState<Record<string, any>>(initialSystemInputs);
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [renderedSystemContent, setRenderedSystemContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);

  const parseInputValue = (value: any, type: string): any => {
    if (type === 'boolean') {
      return Boolean(value);
    }
    if (type === 'object' || type === 'array') {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  const renderTemplate = (content: string, contextInputs: Record<string, any>, params: any) => {
    try {
      const parsedInputs = Object.entries(contextInputs).reduce((acc, [key, value]) => {
        const paramType = params?.properties[key]?.type || 'string';
        acc[key] = parseInputValue(value, paramType);
        return acc;
      }, {} as Record<string, any>);

      return nunjucks.renderString(content, parsedInputs);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error rendering template');
    }
  };

  const updateRenderedContent = () => {
    try {
      const rendered = renderTemplate(prompt.content, inputs, prompt.parameters);
      setRenderedContent(rendered);
      setError(null);
      onChange?.(inputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error rendering template');
    }

    if (systemPrompt?.content) {
      try {
        const renderedSystem = renderTemplate(systemPrompt.content, systemInputs, systemPrompt.parameters);
        setRenderedSystemContent(renderedSystem);
        setSystemError(null);
        onSystemChange?.(systemInputs);
      } catch (err) {
        setSystemError(err instanceof Error ? err.message : 'Error rendering system template');
      }
    }
  };

  useEffect(() => {
    if (prompt.content) {
      updateRenderedContent();
    }
  }, [prompt.content, systemPrompt?.content]);

  const handleInputChange = (key: string, value: string | boolean | number, isSystem: boolean = false) => {
    if (isSystem) {
      setSystemInputs(prev => ({
        ...prev,
        [key]: value
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  if (!prompt.is_templated) {
    return (
      <Card className="w-full">
        <CardContent>
          <Typography color="error">
            This prompt is not templated. Use regular prompt view instead.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent>
        <Box className="space-y-4">
          {systemPrompt && systemPrompt.parameters && (
            <>
              <ParameterInputFields
                parameters={systemPrompt.parameters}
                values={systemInputs}
                onChange={(key, value) => handleInputChange(key, value, true)}
                title="System Prompt Variables"
              />
              {systemError && (
                <Typography color="error" className="mt-4">
                  {systemError}
                </Typography>
              )}
              <Divider className="my-6" />
            </>
          )}

          {prompt.parameters && (
            <ParameterInputFields
              parameters={prompt.parameters}
              values={inputs}
              onChange={(key, value) => handleInputChange(key, value, false)}
              title="Prompt Variables"
            />
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={updateRenderedContent}
            className="mt-4"
          >
            Update Render
          </Button>

          {error && (
            <Typography color="error" className="mt-4">
              {error}
            </Typography>
          )}

          <Box className="mt-6">
            <Typography variant="h6" className="mb-2">Rendered Output</Typography>
            <Card variant="outlined" className="p-4 bg-gray-50">
              {systemPrompt && renderedSystemContent && (
                <Box className="mb-1">
                <AliceMarkdown role={RoleType.SYSTEM}>
                  {renderedSystemContent}
                </AliceMarkdown>
                </Box>
              )}
              <AliceMarkdown role={RoleType.USER}>
                {renderedContent}
              </AliceMarkdown>
            </Card>
          </Box>

          {systemPrompt && (
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="system-prompt-content"
                id="system-prompt-content-header"
              >
                <Typography>System Prompt Template</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <AliceMarkdown showCopyButton role={RoleType.SYSTEM}>
                  {systemPrompt.content}
                </AliceMarkdown>
              </AccordionDetails>
            </Accordion>
          )}
          
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls="user-prompt-content"
              id="user-prompt-content-header"
            >
              <Typography>Prompt Template</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <AliceMarkdown showCopyButton role={RoleType.USER}>
                {prompt.content}
              </AliceMarkdown>
            </AccordionDetails>
          </Accordion>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PromptParsedView;