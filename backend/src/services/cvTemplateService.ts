import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.resolve(__dirname, '../../IA/cv_template.html');
const SAMPLE_PDF_PATH = path.resolve(
  __dirname,
  '../../IA/outputs/CV_Sophie_Martin_Fintech_Innovate.pdf'
);

export const getCvTemplateHtml = async () => {
  return fs.readFile(TEMPLATE_PATH, 'utf-8');
};

export const getSampleCvPdf = async () => {
  return fs.readFile(SAMPLE_PDF_PATH);
};
