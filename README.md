# Examon DPP Converter

> Convert raw question files into branded, bilingual, print-ready DPP PDFs.

[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey?style=for-the-badge)](#license)

Examon DPP Converter is a desktop-first publishing tool created to reduce the repetitive work involved in formatting Daily Practice Problems. It reads raw question content, detects questions and solutions, applies Examon's A4 layout and produces downloadable HTML and PDF files.

## Why this project exists

Preparing DPPs manually requires repeated formatting, pagination, bilingual alignment, answer-key checks, branding and PDF export. This application turns that workflow into a guided conversion process.

## Features

- Imports DOCX, PDF, TXT, HTML or pasted text/JSON
- Detects questions before generating the final document
- Supports English, Hindi and bilingual output modes
- Preserves options, answers and detailed solutions
- Applies Examon branding, header, footer and optional watermark
- Supports automatic space-aware pagination or fixed items per page
- Formats common symbols, superscripts, subscripts and engineering units
- Generates both an HTML preview and an A4 PDF
- Runs as a local Express application or packaged Windows desktop app
- Stores uploaded and generated files in the application's local data directory

## Processing flow

```text
DOCX / PDF / TXT / HTML / pasted content
                    |
                    v
           Question parser
                    |
                    v
       Structured DPP data model
                    |
                    v
      Branded A4 HTML template
                    |
                    v
        HTML preview + final PDF
```

## Tech stack

| Area | Technology |
|---|---|
| Desktop shell | Electron |
| Local server | Node.js, Express |
| Upload handling | Multer |
| DOCX extraction | Mammoth |
| PDF extraction | pdf-parse |
| PDF rendering | Electron `printToPDF` or Playwright Chromium |
| Interface | HTML, CSS and browser JavaScript |

## Run locally

### Prerequisites

- Node.js 18 or later
- npm

```bash
git clone https://github.com/khushi-jain-daga/Examon-DPP-Converter.git
cd Examon-DPP-Converter
npm install
npm start
```

Open [http://127.0.0.1:3210](http://127.0.0.1:3210).

## Run the desktop application

```bash
npm run desktop
```

## Build a portable Windows application

```bash
npm run dist
```

The generated executable is written to the `dist` directory.

## Using the converter

1. Enter the title, topic, DPP number and subject tag.
2. Select the output language and pagination mode.
3. Upload a supported file or paste structured question text.
4. Use **Check Detected Questions** to review the parser result.
5. Generate and download the final PDF or HTML preview.

## Privacy

The application is designed to run locally. Uploaded question files and generated outputs remain in the local application data directory unless the user shares them separately.

## Known limitations

- Scanned PDFs require OCR before the text can be parsed reliably.
- Highly irregular source formatting may require cleanup before conversion.
- Internet access may be needed when the document renderer loads web fonts.

## License

Copyright © Examon Education. This project is currently proprietary and is not licensed for redistribution.
