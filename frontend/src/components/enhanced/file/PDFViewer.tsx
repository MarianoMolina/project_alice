import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  NavigateNext,
  NavigateBefore,
  Timer,
  TextFields
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import Logger from '../../../utils/Logger';
import ContentStats from '../../ui/markdown/ContentStats';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  url: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [strContent, setStrContent] = useState('');

  useEffect(() => {
    const extractText = async () => {
      try {
        const pdf = await pdfjs.getDocument(url).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map(item => 'str' in item ? item.str : '')
            .join(' ');
          fullText += pageText + '\n';
        }
        
        setStrContent(fullText);
      } catch (err) {
        Logger.error('Error extracting PDF text:', err);
      }
    };

    if (url) {
      extractText();
    }
  }, [url]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    Logger.info('PDF loaded successfully', { numPages });
    setNumPages(numPages);
    setPageNumber(1);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    Logger.error('Error loading PDF:', error);
    setError(`Failed to load PDF: ${error.message}`);
    setIsLoading(false);
  };

  if (error) {
    return (
      <Box className="flex justify-center items-center p-4">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <ContentStats content={strContent} />
      <Box className="relative min-h-[400px]">
        {/* PDF Controls - Only show when document is loaded */}
        {!isLoading && numPages > 0 && (
          <Box className="absolute top-2 right-2 z-10 flex gap-2">
            <Tooltip title="Previous page">
              <IconButton
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
                size="small"
                className="bg-white bg-opacity-75 hover:bg-opacity-100"
              >
                <NavigateBefore />
              </IconButton>
            </Tooltip>
            <Typography className="bg-white bg-opacity-75 px-2 py-1 rounded">
              {pageNumber} / {numPages}
            </Typography>
            <Tooltip title="Next page">
              <IconButton
                onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                disabled={pageNumber >= numPages}
                size="small"
                className="bg-white bg-opacity-75 hover:bg-opacity-100"
              >
                <NavigateNext />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom out">
              <IconButton
                onClick={() => setScale(prev => Math.max(prev - 0.2, 0.4))}
                size="small"
                className="bg-white bg-opacity-75 hover:bg-opacity-100"
              >
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom in">
              <IconButton
                onClick={() => setScale(prev => Math.min(prev + 0.2, 2.0))}
                size="small"
                className="bg-white bg-opacity-75 hover:bg-opacity-100"
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <Box className="absolute inset-0 flex justify-center items-center">
            <CircularProgress size={24} />
          </Box>
        )}

        {/* PDF Document */}
        <Box className="flex justify-center">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <Box className="flex justify-center items-center p-4">
                <CircularProgress size={24} />
              </Box>
            }
          >
            {numPages > 0 && (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                className="shadow-lg"
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <Box className="flex justify-center items-center p-4">
                    <CircularProgress size={24} />
                  </Box>
                }
              />
            )}
          </Document>
        </Box>
      </Box>
    </>
  );
};

export default PDFViewer;