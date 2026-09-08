import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { SupportedFileType } from '../models/Document';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  fullText: string;
  pages: ExtractedPage[];
  pageCount: number;
  characterCount: number;
  metadata?: Record<string, any>;
}

export const extractTextFromFile = async (
  filePath: string,
  fileType: SupportedFileType
): Promise<ExtractionResult> => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  switch (fileType) {
    case 'pdf':
      return extractPdf(filePath);
    case 'docx':
      return extractDocx(filePath);
    case 'txt':
    case 'md':
      return extractPlainText(filePath);
    default:
      throw new Error(`Unsupported file type for extraction: ${fileType}`);
  }
};

const extractPdf = async (filePath: string): Promise<ExtractionResult> => {
  const dataBuffer = fs.readFileSync(filePath);
  
  const pages: ExtractedPage[] = [];
  let currentPage = 1;

  const options: pdfParse.Options = {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        let lastY: number | null = null;
        let text = '';
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === null) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        pages.push({
          pageNumber: currentPage++,
          text: cleanExtractedText(text),
        });
        return text;
      });
    },
  };

  const pdfData = await pdfParse(dataBuffer, options);
  const fullText = cleanExtractedText(pdfData.text);

  // If pagerender didn't populate for any reason, create a fallback single page
  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      text: fullText,
    });
  }

  return {
    fullText,
    pages,
    pageCount: pdfData.numpages || pages.length || 1,
    characterCount: fullText.length,
    metadata: {
      info: pdfData.info,
    },
  };
};

const extractDocx = async (filePath: string): Promise<ExtractionResult> => {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  const cleanedText = cleanExtractedText(result.value);

  // Split roughly by ~2500 chars to simulate pages if needed
  const pages: ExtractedPage[] = [];
  const pageSize = 2500;
  for (let i = 0; i < cleanedText.length; i += pageSize) {
    pages.push({
      pageNumber: Math.floor(i / pageSize) + 1,
      text: cleanedText.slice(i, i + pageSize),
    });
  }

  if (pages.length === 0) {
    pages.push({ pageNumber: 1, text: cleanedText });
  }

  return {
    fullText: cleanedText,
    pages,
    pageCount: pages.length,
    characterCount: cleanedText.length,
    metadata: {
      messages: result.messages,
    },
  };
};

const extractPlainText = async (filePath: string): Promise<ExtractionResult> => {
  const rawText = fs.readFileSync(filePath, 'utf-8');
  const cleanedText = cleanExtractedText(rawText);

  // Split roughly by 2500 chars to represent sections/pages
  const pages: ExtractedPage[] = [];
  const pageSize = 2500;
  for (let i = 0; i < cleanedText.length; i += pageSize) {
    pages.push({
      pageNumber: Math.floor(i / pageSize) + 1,
      text: cleanedText.slice(i, i + pageSize),
    });
  }

  if (pages.length === 0) {
    pages.push({ pageNumber: 1, text: cleanedText });
  }

  return {
    fullText: cleanedText,
    pages,
    pageCount: pages.length,
    characterCount: cleanedText.length,
  };
};

/**
 * Normalizes and cleans text by removing null bytes, erratic whitespace, and control characters
 */
export const cleanExtractedText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\u0000/g, '') // remove null characters
    .replace(/[ \t]{2,}/g, ' ') // collapse multi-spaces
    .replace(/\n{3,}/g, '\n\n') // collapse multi-newlines
    .trim();
};
