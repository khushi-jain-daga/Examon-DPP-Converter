function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildDppHtml(dpp, options = {}) {
  const config = {
    logoPath: options.logoPath || '/assets/examon-logo.png',
    mode: options.mode || 'auto',
    fixedQuestionsPerPage: Number(options.fixedQuestionsPerPage || 5),
    fixedSolutionsPerPage: Number(options.fixedSolutionsPerPage || 8),
    enableWatermark: options.enableWatermark !== false,
    fontScale: options.fontScale || 'normal',
    languageMode: options.languageMode || dpp.languageMode || 'bilingual'
  };

  const dataJson = JSON.stringify(dpp).replace(/</g, '\\u003c');
  const configJson = JSON.stringify(config).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${escapeHtml(dpp.title)} - ${escapeHtml(dpp.subtitle)} - ${escapeHtml(dpp.dppNumber)}</title>

<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>

<style>
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

body {
    background: #eef3f8;
    font-family: "Poppins", "Noto Sans Devanagari", Arial, sans-serif;
    color: #111827;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.page {
    width: 210mm;
    height: 297mm;
    margin: 10mm auto;
    background: #ffffff;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 26px rgba(15, 23, 42, 0.16);
    page-break-after: always;
}

.top-header {
    position: absolute;
    left: 12mm;
    right: 12mm;
    top: 9mm;
    height: 18mm;
    background: linear-gradient(135deg, #062044 0%, #082c5f 55%, #0b3b78 100%);
    color: #fff;
    border-radius: 3mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3.2mm 5mm;
    box-shadow: 0 2px 7px rgba(0, 0, 0, 0.18);
    z-index: 3;
}

.title-block h1 {
    margin: 0;
    padding: 0;
    font-size: 21px;
    line-height: 1.05;
    font-weight: 800;
    letter-spacing: 0.7px;
}

.title-block h2 {
    margin: 1.2mm 0 0;
    padding: 0;
    font-size: 12.5px;
    line-height: 1.15;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.92);
}

.dpp-badge {
    min-width: 24mm;
    height: 9mm;
    border-radius: 6mm;
    background: #ffffff;
    color: #051f42;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 15.5px;
    border: 1.4px solid #89d8ff;
    box-shadow: inset 0 0 0 1px rgba(137, 216, 255, 0.25);
    white-space: nowrap;
}

.content {
    position: absolute;
    left: 12mm;
    right: 12mm;
    top: 32mm;
    bottom: 16mm;
    z-index: 2;
}

.questions-grid {
    height: auto;
    display: flex;
    flex-direction: column;
    gap: 2.45mm;
}

.question-card {
    position: relative;
    border: 1.1px solid #d7dee9;
    border-left: 2.2px solid #0a2f63;
    border-radius: 1.6mm;
    background: rgba(255, 255, 255, 0.95);
    padding: 2.35mm 2.7mm 2.05mm 2.75mm;
    overflow: hidden;
    display: block;
}

.question-tag {
    position: absolute;
    top: 1.15mm;
    right: 1.8mm;
    border-radius: 5mm;
    background: #eef4ff;
    color: #0a2f63;
    border: 1px solid #d8e5f8;
    font-size: 13.6px;
    line-height: 1;
    font-weight: 700;
    padding: 1mm 2mm;
    max-width: 62mm;
    text-align: center;
    white-space: nowrap;
}

.q-main {
    display: grid;
    grid-template-columns: 8.2mm 1fr;
    gap: 1.45mm;
    padding-right: 62mm;
}

.qno {
    color: #071f45;
    font-weight: 800;
    font-size: 14.8px;
    line-height: 1.25;
}

.qtext {
    font-size: 14.2px;
    line-height: 1.28;
    font-weight: 600;
}

.qtext .hindi {
    margin-top: 0.4mm;
    font-weight: 500;
    overflow: hidden;
}

.options {
    margin-top: 1.05mm;
    margin-left: 9.65mm;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 2.8mm;
    row-gap: 0.58mm;
    font-size: 13.25px;
    line-height: 1.22;
    font-weight: 600;
}

.option {
    min-height: auto;
    padding: 0.2mm 0.35mm;
}

.opt-label {
    font-weight: 800;
    color: #0a2f63;
}

.solution-heading {
    font-size: 19px;
    line-height: 1;
    color: #0a2f63;
    font-weight: 800;
    text-align: center;
    letter-spacing: 0.3px;
    margin: 0 0 2.4mm;
    text-transform: uppercase;
}

.solutions-grid {
    height: auto;
    display: flex;
    flex-direction: column;
    gap: 2.15mm;
}

.solution-item {
    border: 1.15px solid #d5dce8;
    border-radius: 1.8mm;
    background: rgba(255, 255, 255, 0.94);
    padding: 2.0mm 2.45mm 1.75mm;
    font-size: 13.15px;
    line-height: 1.27;
    font-weight: 500;
    overflow: hidden;
}

.sol-title {
    font-weight: 800;
    color: #071f45;
    margin-bottom: 0.3mm;
}

.sol-hi {
    font-family: "Noto Sans Devanagari", "Poppins", Arial, sans-serif;
    font-weight: 600;
    margin-bottom: 0.25mm;
}

.sol-label {
    color: #0a2f63;
    font-weight: 800;
}

.watermark {
    position: absolute;
    left: 50%;
    top: 54%;
    transform: translate(-50%, -50%);
    width: 120mm;
    height: 120mm;
    z-index: 9999;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.watermark img {
    width: 100%;
    height: auto;
    opacity: 0.13;
    object-fit: contain;
    mix-blend-mode: multiply;
}

footer {
    position: absolute;
    left: 12mm;
    right: 12mm;
    bottom: 5mm;
    height: 7.5mm;
    border-top: 2px solid #0a2f63;
    display: grid;
    grid-template-columns: 1fr 1.5fr 1.7fr;
    align-items: center;
    gap: 2mm;
    color: #0a2f63;
    font-size: 11.4px;
    line-height: 1;
    font-weight: 700;
    z-index: 4;
    white-space: nowrap;
}

footer div:nth-child(2) { text-align: center; }
footer div:nth-child(3) { text-align: right; }

.hindi {
    font-family: "Noto Sans Devanagari", "Poppins", Arial, sans-serif;
}

sup {
    font-size: 0.72em;
    line-height: 0;
    vertical-align: super;
}

sub {
    font-size: 0.72em;
    line-height: 0;
    vertical-align: sub;
}

.math {
    font-family: "Times New Roman", "Poppins", serif;
    font-weight: 700;
    white-space: nowrap;
}

.font-plus-2 .qtext { font-size: 15.2px; }
.font-plus-2 .options { font-size: 14.15px; }
.font-plus-2 .solution-item { font-size: 14.1px; }

.font-plus-4 .qtext { font-size: 16.2px; }
.font-plus-4 .options { font-size: 15px; }
.font-plus-4 .solution-item { font-size: 15px; }

.render-root {
    min-height: 297mm;
}

@media print {
    html, body {
        width: 210mm;
        background: #ffffff;
    }

    .page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
    }

    @page {
        size: A4 portrait;
        margin: 0;
    }
}
</style>
</head>

<body class="${config.fontScale === '+2' ? 'font-plus-2' : config.fontScale === '+4' ? 'font-plus-4' : ''}">
<div id="render-root" class="render-root"></div>

<script>
window.__DPP_DATA__ = ${dataJson};
window.__DPP_CONFIG__ = ${configJson};

function escapeText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function convertFormulaText(value) {
  let x = String(value || '');

  x = x
    .replace(/\\u00A0/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();

  x = x
    .replace(/\\bDelta\\b/g, 'Δ')
    .replace(/\\btheta\\b/gi, 'θ')
    .replace(/\\bmu\\b/gi, 'μ')
    .replace(/\\beta\\b/gi, 'η')
    .replace(/\\bpi\\b/gi, 'π')
    .replace(/\\bapprox\\b/gi, '≈');

  x = x
    .replace(/\\+-/g, '±')
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥')
    .replace(/!=/g, '≠');

  x = x
    .replace(/\\bQH\\b/g, 'Q<sub>H</sub>')
    .replace(/\\bQL\\b/g, 'Q<sub>L</sub>')
    .replace(/\\bCOPR\\b/g, 'COP<sub>R</sub>')
    .replace(/\\bCOPHP\\b/g, 'COP<sub>HP</sub>')
    .replace(/\\bWnet\\b/g, 'W<sub>net</sub>')
    .replace(/\\bWin\\b/g, 'W<sub>in</sub>')
    .replace(/\\bh1\\b/g, 'h<sub>1</sub>')
    .replace(/\\bh2\\b/g, 'h<sub>2</sub>')
    .replace(/\\bV1\\b/g, 'V<sub>1</sub>')
    .replace(/\\bV2\\b/g, 'V<sub>2</sub>')
    .replace(/\\bgz1\\b/g, 'gz<sub>1</sub>')
    .replace(/\\bgz2\\b/g, 'gz<sub>2</sub>');

  x = x
    .replace(/\\^\\s*2/g, '<sup>2</sup>')
    .replace(/\\^\\s*3/g, '<sup>3</sup>')
    .replace(/\\^\\s*4/g, '<sup>4</sup>')
    .replace(/\\^\\s*5/g, '<sup>5</sup>')
    .replace(/\\^\\s*6/g, '<sup>6</sup>')
    .replace(/\\^\\s*7/g, '<sup>7</sup>')
    .replace(/\\^\\s*8/g, '<sup>8</sup>')
    .replace(/\\^\\s*9/g, '<sup>9</sup>')
    .replace(/²/g, '<sup>2</sup>')
    .replace(/³/g, '<sup>3</sup>')
    .replace(/⁴/g, '<sup>4</sup>')
    .replace(/⁵/g, '<sup>5</sup>')
    .replace(/⁶/g, '<sup>6</sup>')
    .replace(/⁷/g, '<sup>7</sup>')
    .replace(/⁸/g, '<sup>8</sup>')
    .replace(/⁹/g, '<sup>9</sup>')
    .replace(/⁰/g, '<sup>0</sup>')
    .replace(/⁻/g, '<sup>-</sup>');

  x = x
    .replace(/\\bm\\s*\\/\\s*s\\s*<sup>2<\\/sup>/gi, 'm/s<sup>2</sup>')
    .replace(/\\brad\\s*\\/\\s*s\\s*<sup>2<\\/sup>/gi, 'rad/s<sup>2</sup>')
    .replace(/\\bm\\s*\\/\\s*s\\b/gi, 'm/s')
    .replace(/\\bkJ\\s*\\/\\s*kg\\b/gi, 'kJ/kg')
    .replace(/\\bm\\s*<sup>2<\\/sup>/gi, 'm<sup>2</sup>')
    .replace(/\\bm\\s*<sup>3<\\/sup>/gi, 'm<sup>3</sup>');

  return x;
}

function html(value) {
  const escaped = escapeText(value);
  return convertFormulaText(escaped).replace(/\\n/g, '<br>');
}

function optionHtml(label, value) {
  return '<div class="option"><span class="opt-label">' + label + ')</span> ' + html(value) + '</div>';
}

function pageShell(type, pageNumber) {
  const data = window.__DPP_DATA__;
  const cfg = window.__DPP_CONFIG__;

  const section = document.createElement('section');
  section.className = 'page ' + type;

  section.innerHTML =
    (cfg.enableWatermark
      ? '<div class="watermark"><img src="' + cfg.logoPath + '" alt="Examon Education watermark"></div>'
      : '') +
    '<header class="top-header">' +
      '<div class="title-block">' +
        '<h1>' + html(data.title) + '</h1>' +
        '<h2>' + html(data.subtitle) + '</h2>' +
      '</div>' +
      '<div class="dpp-badge">' + html(data.dppNumber) + '</div>' +
    '</header>' +
    '<main class="content"></main>' +
    '<footer>' +
      '<div>Page ' + pageNumber + '</div>' +
      '<div>Download Examon Education app</div>' +
      '<div>For Any info contact on : 8368886452</div>' +
    '</footer>';

  return section;
}

function questionCard(q) {
  const cfg = window.__DPP_CONFIG__;
  const isBilingual = cfg.languageMode === 'bilingual';
  const subjectTag = window.__DPP_DATA__.subjectTag || window.__DPP_DATA__.title;

  const questionEnglish = q.questionEnglish || '';
  const questionHindi = isBilingual ? (q.questionHindi || '') : '';

  const rawOpts = q.options || {};

  const textLength =
    questionEnglish.length +
    questionHindi.length +
    Object.values(rawOpts).join('').length;

  const cls = textLength > 520 ? 'very-long' : textLength > 320 ? 'long' : '';

  const article = document.createElement('article');
  article.className = 'question-card ' + cls;

  article.innerHTML =
    '<div class="question-tag">' + html(subjectTag) + '</div>' +
    '<div class="q-main">' +
      '<div class="qno">Q' + html(q.qno) + '.</div>' +
      '<div class="qtext">' +
        '<div>' + html(questionEnglish) + '</div>' +
        (questionHindi ? '<div class="hindi">' + html(questionHindi) + '</div>' : '') +
      '</div>' +
    '</div>' +
    '<div class="options">' +
      optionHtml('A', rawOpts.A || '') +
      optionHtml('B', rawOpts.B || '') +
      optionHtml('C', rawOpts.C || '') +
      optionHtml('D', rawOpts.D || '') +
    '</div>';

  return article;
}

function splitOptionLanguages(value) {
  const raw = String(value || '').replace(/\\r/g, '').trim();

  if (!raw) {
    return { english: '', hindi: '' };
  }

  const english = [];
  const hindi = [];

  raw.split(/\\n+/).map(line => line.trim()).filter(Boolean).forEach(line => {
    const hindiStart = line.search(/[\u0900-\u097F]/);

    if (hindiStart === -1) {
      english.push(line);
      return;
    }

    const englishPart = line.slice(0, hindiStart).trim();
    const hindiPart = line.slice(hindiStart).trim();

    if (englishPart) english.push(englishPart);
    if (hindiPart) hindi.push(hindiPart);
  });

  const unique = items => [...new Set(items.map(item => item.trim()).filter(Boolean))].join(' ').trim();

  return {
    english: unique(english),
    hindi: unique(hindi)
  };
}

function correctOptionText(q) {
  const answer = String(q.answer || '').trim().charAt(0).toUpperCase();
  const option = q.options && q.options[answer] ? q.options[answer] : '';
  const parts = splitOptionLanguages(option);

  if (!answer) {
    return { english: '', hindi: '' };
  }

  return {
    english: answer + (parts.english ? ') ' + parts.english : ''),
    hindi: answer + (parts.hindi ? ') ' + parts.hindi : (parts.english ? ') ' + parts.english : ''))
  };
}

function solutionCard(q) {
  const cfg = window.__DPP_CONFIG__;
  const isBilingual = cfg.languageMode === 'bilingual';

  const solutionEnglish = q.solutionEnglish || '';
  const solutionHindi = isBilingual ? (q.solutionHindi || '') : '';

  const textLength = solutionEnglish.length + solutionHindi.length;
  const cls = textLength > 700 ? 'very-long' : textLength > 440 ? 'long' : '';

  const article = document.createElement('article');
  article.className = 'solution-item ' + cls;

  const correct = correctOptionText(q);
  const answer = String(q.answer || '').trim().charAt(0).toUpperCase();
  const englishAnswer = correct.english || answer;
  const hindiAnswer = correct.hindi || englishAnswer;

  article.innerHTML =
    '<div class="sol-title">Q' + html(q.qno) + '. Correct Answer: ' + html(englishAnswer) + '</div>' +
    (isBilingual && hindiAnswer
      ? '<div class="sol-hi">सही उत्तर: ' + html(hindiAnswer) + '</div>'
      : '') +
    '<div>' +
      (isBilingual ? '<span class="sol-label">English:</span> ' : '') +
      html(solutionEnglish || 'Solution not detected. Please check raw file formatting.') +
    '</div>' +
    (solutionHindi
      ? '<div class="hindi"><span class="sol-label">Hindi:</span> ' + html(solutionHindi) + '</div>'
      : '');

  return article;
}

function overflows(content) {
  return content.scrollHeight > content.clientHeight + 1;
}

function paginateItems(items, type, makeCard, makeHeading, fixedCount) {
  const root = document.getElementById('render-root');

  let pageNumber = document.querySelectorAll('.page').length + 1;
  let page = pageShell(type, pageNumber);
  let content = page.querySelector('.content');

  let grid = document.createElement('div');
  grid.className = type === 'question-page' ? 'questions-grid' : 'solutions-grid';

  if (makeHeading && items.length) {
    content.appendChild(makeHeading(items[0], items[0]));
  }

  content.appendChild(grid);
  root.appendChild(page);

  let countOnPage = 0;
  let firstOnCurrentPage = null;

  for (const item of items) {
    if (!firstOnCurrentPage) {
      firstOnCurrentPage = item;
    }

    const card = makeCard(item);
    grid.appendChild(card);
    countOnPage++;

    const fixedOverflow = window.__DPP_CONFIG__.mode === 'fixed' && fixedCount && countOnPage > fixedCount;
    const isOverflow = overflows(content);

    if (isOverflow && countOnPage === 1 && window.__DPP_CONFIG__.mode !== 'fixed') {
      card.classList.add('very-long');
      continue;
    }

    if (fixedOverflow || isOverflow) {
      grid.removeChild(card);

      if (makeHeading) {
        const heading = content.querySelector('.solution-heading');
        const prevIndex = items.indexOf(item) - 1;

        if (heading && firstOnCurrentPage && items[prevIndex]) {
          heading.textContent =
            'SOLUTIONS & ANSWER KEY (' +
            firstOnCurrentPage.qno +
            ' - ' +
            items[prevIndex].qno +
            ')';
        }
      }

      pageNumber = document.querySelectorAll('.page').length + 1;
      page = pageShell(type, pageNumber);
      content = page.querySelector('.content');

      grid = document.createElement('div');
      grid.className = type === 'question-page' ? 'questions-grid' : 'solutions-grid';

      if (makeHeading) {
        content.appendChild(makeHeading(item, item));
      }

      content.appendChild(grid);
      root.appendChild(page);

      grid.appendChild(card);
      countOnPage = 1;
      firstOnCurrentPage = item;
    }
  }

  if (makeHeading && items.length) {
    const pages = document.querySelectorAll('.' + type);
    const lastPage = pages[pages.length - 1];
    const heading = lastPage.querySelector('.solution-heading');
    const cards = lastPage.querySelectorAll('.solution-item');

    if (heading && cards.length) {
      const firstTitle = cards[0].querySelector('.sol-title').textContent.match(/Q(\\d+)/);
      const lastTitle = cards[cards.length - 1].querySelector('.sol-title').textContent.match(/Q(\\d+)/);

      heading.textContent =
        'SOLUTIONS & ANSWER KEY (' +
        (firstTitle ? firstTitle[1] : '') +
        ' - ' +
        (lastTitle ? lastTitle[1] : '') +
        ')';
    }
  }
}

function solutionHeading(first, last) {
  const h = document.createElement('h3');
  h.className = 'solution-heading';
  h.textContent = 'SOLUTIONS & ANSWER KEY (' + first.qno + ' - ' + last.qno + ')';
  return h;
}

function render() {
  const data = window.__DPP_DATA__;
  const cfg = window.__DPP_CONFIG__;
  const questions = Array.isArray(data.questions) ? data.questions : [];

  paginateItems(
    questions,
    'question-page',
    questionCard,
    null,
    cfg.fixedQuestionsPerPage
  );

  paginateItems(
    questions,
    'solution-page',
    solutionCard,
    solutionHeading,
    cfg.fixedSolutionsPerPage
  );

  document.querySelectorAll('.page').forEach((p, index) => {
    const foot = p.querySelector('footer div:first-child');
    if (foot) {
      foot.textContent = 'Page ' + (index + 1);
    }
  });

  window.__DPP_READY__ = true;
}

window.addEventListener('load', () => {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(render);
  } else {
    setTimeout(render, 100);
  }
});
</script>
</body>
</html>`;
}

module.exports = { buildDppHtml };