const path = require('path');
const fs = require('fs/promises');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/td>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/table>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function parseInputFile(filePath, originalName = '') {
  const ext = path.extname(originalName || filePath).toLowerCase();
  const buffer = await fs.readFile(filePath);

  if (ext === '.docx') {
    const result = await mammoth.convertToHtml({ buffer });
    return stripHtml(result.value || '');
  }

  if (ext === '.pdf') {
    const result = await pdfParse(buffer);
    return String(result.text || '').trim();
  }

  if (ext === '.txt' || ext === '.html' || ext === '.htm' || ext === '') {
    return buffer.toString('utf8');
  }

  throw new Error(`Unsupported file type: ${ext}. Use DOCX, PDF, TXT, or paste text.`);
}

function cleanLine(line) {
  return String(line || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\uFFFC/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function hasHindi(text) {
  return /[\u0900-\u097F]/.test(String(text || ''));
}

function uniqueLines(lines) {
  const out = [];
  const seen = new Set();

  for (const line of lines.map(cleanLine).filter(Boolean)) {
    const key = line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(line);
    }
  }

  return out;
}

function cleanSourcePrefix(line) {
  return cleanLine(line)
    .replace(/^Source\s+Question\s+No\.?\s*\d+\s*Question\s*[:：-]?\s*/i, '')
    .replace(/^Source\s+Question\s+No\.?\s*\d+\s*[:：-]?\s*/i, '')
    .replace(/^Question\s+No\.?\s*\d+\s*Question\s*[:：-]?\s*/i, '')
    .replace(/^Question\s+No\.?\s*\d+\s*[:：-]?\s*/i, '')
    .replace(/^Question\s*[:：-]\s*/i, '')
    .trim();
}

function removeQuestionPrefix(line) {
  return cleanSourcePrefix(line)
    .replace(/^Q\s*\d+\s*[\).:-]\s*/i, '')
    .replace(/^Question\s*\d+\s*[\).:-]\s*/i, '')
    .replace(/^प्रश्न\s*\d+\s*[\).:-]\s*/i, '')
    .trim();
}

function removeKnownPrefix(line) {
  return cleanLine(line)
    .replace(/^(Solution\s+in\s+English|Solution|Sol\.|Explanation|Detailed Solution)\s*[:\-]?\s*/i, '')
    .replace(/^(समाधान\s*हिंदी\s*में|समाधान|व्याख्या)\s*[:：\-]?\s*/i, '')
    .replace(/^(Answer\s*\/\s*उत्तर|Answer|Ans|Correct Answer)\s*[:：\-]?\s*/i, '')
    .replace(/^(उत्तर|सही उत्तर)\s*[:：\-]\s*/i, '')
    .replace(/^(उत्तर|सही उत्तर)\s+\(?[A-Da-d]\)?\s*$/i, '')
    .trim();
}

function parseOptionMarker(line) {
  const cleaned = cleanLine(line);

  let match = cleaned.match(/^\(\s*\)?\s*([A-Da-d])\s*[\).:\-]?\s*(.*)$/);
  if (match) {
    return {
      label: match[1].toUpperCase(),
      value: cleanLine(match[2] || '')
    };
  }

  match = cleaned.match(/^\(?\s*([A-Da-d])\s*\)?\s*[\).:\-]\s*(.*)$/);
  if (match) {
    return {
      label: match[1].toUpperCase(),
      value: cleanLine(match[2] || '')
    };
  }

  match = cleaned.match(/^\(\s*([A-Da-d])\s*\)\s*(.*)$/);
  if (match) {
    return {
      label: match[1].toUpperCase(),
      value: cleanLine(match[2] || '')
    };
  }

  return null;
}

function isAnswerLine(line) {
  const text = cleanLine(line);

  // English answer lines are normally: Answer: (B), Answer B, Ans: C
  if (/^(Answer\s*\/\s*उत्तर|Answer|Ans|Correct Answer)\s*[:：\-]?\s*\(?\s*[A-Da-d]\s*\)?\s*$/i.test(text)) {
    return true;
  }

  // Hindi answer lines must have a delimiter after उत्तर.
  // This prevents false matches like 'उत्तर से दक्षिण...' or 'उत्तरी मैदान...'.
  if (/^(उत्तर|सही उत्तर)\s*[:：\-]\s*\(?\s*[A-Da-d]\s*\)?\s*$/i.test(text)) {
    return true;
  }

  if (/^(उत्तर|सही उत्तर)\s+\(?\s*[A-Da-d]\s*\)?\s*$/i.test(text)) {
    return true;
  }

  return false;
}

function isSolutionLine(line) {
  return /^(Solution\s+in\s+English|Solution|Sol\.|Explanation|Detailed Solution|समाधान|व्याख्या)/i.test(cleanLine(line));
}

function answerStartIndex(lines) {
  return lines.findIndex(isAnswerLine);
}

function solutionStartIndex(lines) {
  return lines.findIndex(isSolutionLine);
}

function extractAnswer(text) {
  const source = String(text || '');
  const patterns = [
    /(?:^|\n)\s*(?:Answer\s*\/\s*उत्तर|Answer|Ans|Correct Answer)\s*[:：\-]?\s*\(?\s*([A-Da-d])\s*\)?/im,
    /(?:^|\n)\s*(?:उत्तर|सही उत्तर)\s*[:：\-]\s*\(?\s*([A-Da-d])\s*\)?/im,
    /(?:^|\n)\s*(?:उत्तर|सही उत्तर)\s+\(?\s*([A-Da-d])\s*\)?\s*$/im
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return match[1].toUpperCase();
  }

  return '';
}

function splitQuestionBlocks(rawText) {
  const normalized = String(rawText || '')
    .replace(/\r/g, '')
    .replace(/Question\s*(\d+)\s*[:.)-]/gi, 'Q$1.')
    .replace(/\n{3,}/g, '\n\n');

  const markerRegex = /(?:^|\n)\s*Q\s*\d+\s*[\).:-]/gi;
  const matches = [...normalized.matchAll(markerRegex)];

  if (!matches.length) return [];

  const blocks = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + (matches[i][0].startsWith('\n') ? 1 : 0);
    const end = i + 1 < matches.length ? matches[i + 1].index : normalized.length;
    blocks.push(normalized.slice(start, end).trim());
  }

  return blocks;
}

function chooseBilingual(lines, languageMode) {
  const cleaned = uniqueLines(lines);

  if (!cleaned.length) return '';

  const english = uniqueLines(cleaned.filter(line => !hasHindi(line)));
  const hindi = uniqueLines(cleaned.filter(line => hasHindi(line)));

  if (languageMode === 'english') {
    return english.join('\n').trim();
  }

  if (languageMode === 'hindi') {
    return hindi.join('\n').trim();
  }

  if (english.length && hindi.length) {
    return [...english, ...hindi].join('\n').trim();
  }

  return cleaned.join('\n').trim();
}

function parseQuestionText(questionLines, languageMode) {
  const cleaned = questionLines
    .map(removeQuestionPrefix)
    .filter(Boolean);

  const englishLines = uniqueLines(cleaned.filter(line => !hasHindi(line)));
  const hindiLines = uniqueLines(cleaned.filter(line => hasHindi(line)));

  if (languageMode === 'english') {
    return {
      english: englishLines.join(' ').replace(/\s{2,}/g, ' ').trim(),
      hindi: ''
    };
  }

  if (languageMode === 'hindi') {
    return {
      english: '',
      hindi: hindiLines.join(' ').replace(/\s{2,}/g, ' ').trim()
    };
  }

  return {
    english: englishLines.join(' ').replace(/\s{2,}/g, ' ').trim(),
    hindi: hindiLines.join(' ').replace(/\s{2,}/g, ' ').trim()
  };
}

function parseOptionsFromLines(lines, start, end, languageMode) {
  const buckets = {
    A: [],
    B: [],
    C: [],
    D: []
  };

  let current = null;

  for (let i = start; i < end; i++) {
    const line = cleanLine(lines[i]);
    if (!line) continue;

    const marker = parseOptionMarker(line);

    if (marker) {
      current = marker.label;

      if (marker.value) {
        buckets[current].push(marker.value);
      }

      continue;
    }

    if (current && !isAnswerLine(line) && !isSolutionLine(line)) {
      buckets[current].push(line);
    }
  }

  return {
    A: chooseBilingual(buckets.A, languageMode),
    B: chooseBilingual(buckets.B, languageMode),
    C: chooseBilingual(buckets.C, languageMode),
    D: chooseBilingual(buckets.D, languageMode)
  };
}

function parseSolutionLines(lines, languageMode) {
  const solStart = solutionStartIndex(lines);

  if (solStart === -1) {
    return {
      english: '',
      hindi: ''
    };
  }

  const english = [];
  const hindi = [];
  let current = null;

  for (let i = solStart; i < lines.length; i++) {
    let line = cleanLine(lines[i]);
    if (!line) continue;

    if (/^(Solution\s+in\s+English|Solution|Sol\.|Explanation|Detailed Solution)\s*[:\-]?/i.test(line)) {
      current = 'english';
      line = removeKnownPrefix(line);

      if (line) {
        if (hasHindi(line)) hindi.push(line);
        else english.push(line);
      }

      continue;
    }

    if (/^(समाधान\s*हिंदी\s*में|समाधान|व्याख्या)\s*[:：\-]?/i.test(line)) {
      current = 'hindi';
      line = removeKnownPrefix(line);

      if (line) hindi.push(line);
      continue;
    }

    if (isAnswerLine(line)) continue;

    if (current === 'english') {
      if (hasHindi(line)) hindi.push(line);
      else english.push(line);
    } else if (current === 'hindi') {
      hindi.push(line);
    }
  }

  if (languageMode === 'english') {
    return {
      english: uniqueLines(english).join(' ').replace(/\s{2,}/g, ' ').trim(),
      hindi: ''
    };
  }

  if (languageMode === 'hindi') {
    return {
      english: '',
      hindi: uniqueLines(hindi).join(' ').replace(/\s{2,}/g, ' ').trim()
    };
  }

  return {
    english: uniqueLines(english).join(' ').replace(/\s{2,}/g, ' ').trim(),
    hindi: uniqueLines(hindi).join(' ').replace(/\s{2,}/g, ' ').trim()
  };
}

function parseBlock(block, fallbackNo, languageMode) {
  const lines = String(block || '').split('\n').map(cleanLine).filter(Boolean);
  if (!lines.length) return null;

  const first = lines[0];
  const qMatch = first.match(/^Q\s*(\d+)\s*[\).:-]\s*(.*)$/i);

  const originalQNo = qMatch ? Number(qMatch[1]) : fallbackNo;
  const firstQuestionText = qMatch ? cleanSourcePrefix(qMatch[2]) : cleanSourcePrefix(first);

  const answerIdx = answerStartIndex(lines);
  const solutionIdx = solutionStartIndex(lines);

  const firstCut = [answerIdx, solutionIdx]
    .filter(i => i !== -1)
    .sort((a, b) => a - b)[0] ?? lines.length;

  let optionStart = -1;

  for (let i = 1; i < firstCut; i++) {
    if (parseOptionMarker(lines[i])) {
      optionStart = i;
      break;
    }
  }

  const beforeOptions = optionStart === -1
    ? lines.slice(1, firstCut)
    : lines.slice(1, optionStart);

  const question = parseQuestionText([firstQuestionText, ...beforeOptions], languageMode);

  const options = optionStart === -1
    ? { A: '', B: '', C: '', D: '' }
    : parseOptionsFromLines(lines, optionStart, firstCut, languageMode);

  const answer = extractAnswer(block);
  const solution = parseSolutionLines(lines, languageMode);

  return {
    originalQNo,
    questionEnglish: question.english,
    questionHindi: question.hindi,
    options,
    answer,
    solutionEnglish: solution.english,
    solutionHindi: solution.hindi
  };
}

function parseJsonIfProvided(rawText, meta) {
  const trimmed = String(rawText || '').trim();

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    const dpp = Array.isArray(parsed) ? { questions: parsed } : parsed;

    return {
      title: dpp.title || meta.title,
      subtitle: dpp.subtitle || meta.subtitle,
      dppNumber: dpp.dppNumber || dpp.dpp || meta.dppNumber,
      subjectTag: dpp.subjectTag || meta.subjectTag,
      languageMode: meta.languageMode,
      questions: (dpp.questions || []).map((q, index) => ({
        qno: meta.startQuestionNo + index,
        originalQNo: q.originalQNo || q.qno || index + 1,
        questionEnglish: cleanSourcePrefix(q.questionEnglish || q.english || q.question || ''),
        questionHindi: meta.languageMode === 'english' ? '' : (q.questionHindi || q.hindi || ''),
        options: q.options || {
          A: q.A || '',
          B: q.B || '',
          C: q.C || '',
          D: q.D || ''
        },
        answer: String(q.answer || '').trim().charAt(0).toUpperCase(),
        solutionEnglish: q.solutionEnglish || q.solution || '',
        solutionHindi: meta.languageMode === 'english' ? '' : (q.solutionHindi || '')
      }))
    };
  } catch (_) {
    return null;
  }
}

function parseRawTextToDpp(rawText, meta = {}) {
  const normalizedMeta = {
    title: meta.title || 'Thermodynamics',
    subtitle: meta.subtitle || 'Practice Questions',
    dppNumber: meta.dppNumber || 'DPP 1',
    subjectTag: meta.subjectTag || meta.title || 'Thermodynamics',
    startQuestionNo: Number(meta.startQuestionNo || 1),
    languageMode: meta.languageMode || 'bilingual'
  };

  const jsonDpp = parseJsonIfProvided(rawText, normalizedMeta);

  if (jsonDpp) {
    return jsonDpp;
  }

  const blocks = splitQuestionBlocks(rawText);

  const questions = blocks
    .map((block, index) => parseBlock(block, index + 1, normalizedMeta.languageMode))
    .filter(Boolean)
    .filter(q => q.questionEnglish || q.questionHindi)
    .map((q, index) => ({
      ...q,
      qno: normalizedMeta.startQuestionNo + index
    }));

  return {
    title: normalizedMeta.title,
    subtitle: normalizedMeta.subtitle,
    dppNumber: normalizedMeta.dppNumber,
    subjectTag: normalizedMeta.subjectTag,
    languageMode: normalizedMeta.languageMode,
    questions
  };
}

module.exports = {
  parseInputFile,
  parseRawTextToDpp
};