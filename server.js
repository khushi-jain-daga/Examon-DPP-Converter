const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const multer = require('multer');

const { parseInputFile, parseRawTextToDpp } = require('./src/parser');
const { buildDppHtml } = require('./src/template');

const app = express();

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_ROOT = process.env.EXAMON_DATA_DIR || ROOT_DIR;
const UPLOAD_DIR = path.join(DATA_ROOT, 'uploads');
const OUTPUT_DIR = path.join(DATA_ROOT, 'outputs');

const upload = multer({
  dest: UPLOAD_DIR,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

app.use('/outputs', express.static(OUTPUT_DIR));
app.use(express.static(PUBLIC_DIR));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

async function ensureDirs() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

function safeName(value) {
  return String(value || 'DPP')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

async function getLogoDataUri() {
  try {
    const logoPath = path.join(PUBLIC_DIR, 'assets', 'examon-logo.png');
    const buffer = await fs.readFile(logoPath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (_) {
    return '/assets/examon-logo.png';
  }
}

function getMetaFromRequest(req) {
  return {
    title: req.body.title || 'History',
    subtitle: req.body.subtitle || 'Practice session',
    dppNumber: req.body.dppNumber || 'DPP 1',
    subjectTag: req.body.subjectTag || req.body.title || 'History',
    startQuestionNo: Number(req.body.startQuestionNo || 1),
    languageMode: req.body.languageMode || 'bilingual'
  };
}

async function getRenderOptions(req) {
  return {
    mode: req.body.layoutMode || 'auto',
    fixedQuestionsPerPage: Number(req.body.questionsPerPage || 5),
    fixedSolutionsPerPage: Number(req.body.solutionsPerPage || 8),
    enableWatermark: req.body.disableWatermark !== 'on',
    fontScale: req.body.fontScale || 'normal',
    languageMode: req.body.languageMode || 'bilingual',
    logoPath: await getLogoDataUri()
  };
}

async function getRawText(req) {
  let rawText = '';

  if (req.file) {
    rawText = await parseInputFile(req.file.path, req.file.originalname);
  }

  if (req.body.rawText && req.body.rawText.trim()) {
    rawText = req.body.rawText;
  }

  if (!rawText || !rawText.trim()) {
    throw new Error('Please upload a raw file or paste raw DPP text.');
  }

  return rawText;
}

async function cleanupUploadedFile(req) {
  if (req.file && req.file.path) {
    try {
      await fs.unlink(req.file.path);
    } catch (_) {}
  }
}

async function generatePdfWithElectron(htmlPath, pdfPath) {
  const { BrowserWindow } = require('electron');

  const pdfWindow = new BrowserWindow({
    show: false,
    width: 794,
    height: 1123,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      offscreen: true
    }
  });

  try {
    await pdfWindow.loadFile(htmlPath);

    await pdfWindow.webContents.executeJavaScript(`
      new Promise((resolve) => {
        if (window.__DPP_READY__ === true) {
          resolve(true);
          return;
        }

        const timer = setInterval(() => {
          if (window.__DPP_READY__ === true) {
            clearInterval(timer);
            resolve(true);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(timer);
          resolve(true);
        }, 30000);
      });
    `);

    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        marginType: 'none'
      }
    });

    await fs.writeFile(pdfPath, pdfData);
  } finally {
    if (!pdfWindow.isDestroyed()) {
      pdfWindow.destroy();
    }
  }
}

async function generatePdfWithPlaywright(htmlPath, pdfPath) {
  const { chromium } = require('playwright');

  let browser;

  try {
    browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage({
      viewport: {
        width: 794,
        height: 1123
      }
    });

    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle'
    });

    await page.waitForFunction(() => window.__DPP_READY__ === true, null, {
      timeout: 30000
    });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function generatePdf(htmlPath, pdfPath) {
  if (process.versions && process.versions.electron) {
    return generatePdfWithElectron(htmlPath, pdfPath);
  }

  return generatePdfWithPlaywright(htmlPath, pdfPath);
}

app.post('/api/preview-data', upload.single('rawFile'), async (req, res) => {
  try {
    const rawText = await getRawText(req);
    const meta = getMetaFromRequest(req);
    const dpp = parseRawTextToDpp(rawText, meta);

    await cleanupUploadedFile(req);

    res.json({
      ok: true,
      questionCount: dpp.questions.length,
      data: dpp
    });
  } catch (err) {
    await cleanupUploadedFile(req);

    res.status(400).json({
      ok: false,
      error: err.message || 'Preview failed.'
    });
  }
});

app.post('/api/generate', upload.single('rawFile'), async (req, res) => {
  try {
    const rawText = await getRawText(req);
    const meta = getMetaFromRequest(req);
    const renderOptions = await getRenderOptions(req);

    const dpp = parseRawTextToDpp(rawText, meta);

    if (!dpp.questions.length) {
      throw new Error('No questions detected. Please check raw file format.');
    }

    const html = buildDppHtml(dpp, renderOptions);

    const timestamp = Date.now();
    const baseFileName = safeName(`${dpp.title}_${dpp.subtitle}_${dpp.dppNumber}_${timestamp}`);

    const htmlFile = `${baseFileName}.html`;
    const pdfFile = `${baseFileName}.pdf`;

    const htmlPath = path.join(OUTPUT_DIR, htmlFile);
    const pdfPath = path.join(OUTPUT_DIR, pdfFile);

    await fs.writeFile(htmlPath, html, 'utf8');

    await generatePdf(htmlPath, pdfPath);
    await cleanupUploadedFile(req);

    res.json({
      ok: true,
      questionCount: dpp.questions.length,
      htmlUrl: `/outputs/${htmlFile}`,
      pdfUrl: `/outputs/${pdfFile}`
    });
  } catch (err) {
    await cleanupUploadedFile(req);

    res.status(400).json({
      ok: false,
      error: err.message || 'PDF generation failed.'
    });
  }
});

async function startServer(port = process.env.PORT || 3210) {
  await ensureDirs();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, '127.0.0.1');

    server.on('listening', () => {
      const address = server.address();
      const actualPort = address.port;

      resolve({
        server,
        port: actualPort,
        url: `http://127.0.0.1:${actualPort}`
      });
    });

    server.on('error', reject);
  });
}

if (require.main === module) {
  startServer(process.env.PORT || 3210).then(({ url }) => {
    console.log(`Examon DPP Converter running at ${url}`);
  });
}

module.exports = {
  app,
  startServer
};