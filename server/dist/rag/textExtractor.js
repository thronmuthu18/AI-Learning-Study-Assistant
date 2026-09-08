"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanExtractedText = exports.extractTextFromFile = void 0;
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const extractTextFromFile = async (filePath, fileType) => {
    if (!fs_1.default.existsSync(filePath)) {
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
exports.extractTextFromFile = extractTextFromFile;
const extractPdf = async (filePath) => {
    const dataBuffer = fs_1.default.readFileSync(filePath);
    const pages = [];
    let currentPage = 1;
    const options = {
        pagerender: (pageData) => {
            return pageData.getTextContent().then((textContent) => {
                let lastY = null;
                let text = '';
                for (const item of textContent.items) {
                    if (lastY === item.transform[5] || lastY === null) {
                        text += item.str;
                    }
                    else {
                        text += '\n' + item.str;
                    }
                    lastY = item.transform[5];
                }
                pages.push({
                    pageNumber: currentPage++,
                    text: (0, exports.cleanExtractedText)(text),
                });
                return text;
            });
        },
    };
    const pdfData = await (0, pdf_parse_1.default)(dataBuffer, options);
    const fullText = (0, exports.cleanExtractedText)(pdfData.text);
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
const extractDocx = async (filePath) => {
    const buffer = fs_1.default.readFileSync(filePath);
    const result = await mammoth_1.default.extractRawText({ buffer });
    const cleanedText = (0, exports.cleanExtractedText)(result.value);
    // Split roughly by ~2500 chars to simulate pages if needed
    const pages = [];
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
const extractPlainText = async (filePath) => {
    const rawText = fs_1.default.readFileSync(filePath, 'utf-8');
    const cleanedText = (0, exports.cleanExtractedText)(rawText);
    // Split roughly by 2500 chars to represent sections/pages
    const pages = [];
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
const cleanExtractedText = (text) => {
    if (!text)
        return '';
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, '  ')
        .replace(/\u0000/g, '') // remove null characters
        .replace(/[ \t]{2,}/g, ' ') // collapse multi-spaces
        .replace(/\n{3,}/g, '\n\n') // collapse multi-newlines
        .trim();
};
exports.cleanExtractedText = cleanExtractedText;
//# sourceMappingURL=textExtractor.js.map