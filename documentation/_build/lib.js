// Shared styles, helpers and source-code extraction for every generated document.
// Code excerpts are read from ../../src at build time, so documents can never drift from the code.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, ImageRun, LevelFormat, CharacterSet, Footer, PageNumber, PageBreak, TableLayoutType,
  VerticalAlign,
} = require('docx');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const DOCS = path.join(ROOT, 'documentation');
const FONT = 'Inter';
const MONO = 'Courier New';
const GREY = '666666';
const ROLLGREY = '434343';
const A4 = { width: 11906, height: 16838 };
const MARGIN = 1440;
const CONTENT_W = A4.width - 2 * MARGIN; // 9026

const STUDENT = {
  name: 'Aditya Sunil Chouksey',
  roll: '150096725070',
  programme: 'B.Tech CSE (2025-29), Semester III',
  subject: 'Java Programming',
  title: 'Restaurant Table Reservation & Waitlist System',
  caseStudy: 'Case Study 70',
};

// ------------------------------------------------------------------ source access (single source of truth)
function readSource(rel) {
  return fs.readFileSync(path.join(SRC, 'com/restaurant', rel), 'utf8').replace(/\r\n/g, '\n');
}

/** Returns the lines of the first block that starts at a line matching `startRe`, through its matching brace. */
function extractBlock(rel, startRe, { includeDoc = true, maxLines = 200 } = {}) {
  const lines = readSource(rel).split('\n');
  let start = lines.findIndex((l) => startRe.test(l));
  if (start < 0) throw new Error(`extractBlock: ${startRe} not found in ${rel}`);
  let first = start;
  if (includeDoc) {
    // pull in a directly preceding javadoc / annotation block
    let k = start - 1;
    while (k >= 0 && /^\s*(@\w+|\*|\/\*\*|\*\/)/.test(lines[k])) k--;
    first = k + 1;
  }
  let depth = 0;
  let seen = false;
  let end = start;
  for (let i = start; i < lines.length; i++) {
    const code = lines[i].replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/\/\/.*$/, '');
    for (const ch of code) {
      if (ch === '{') { depth++; seen = true; }
      if (ch === '}') depth--;
    }
    if (seen && depth === 0) { end = i; break; }
    if (!seen && /;\s*$/.test(code)) { end = i; break; }
  }
  const out = lines.slice(first, end + 1);
  if (out.length > maxLines) throw new Error(`extractBlock: ${startRe} in ${rel} is ${out.length} lines`);
  return dedent(out);
}

/** Lines from the first match of startRe to the first following match of endRe (inclusive). */
function extractRange(rel, startRe, endRe) {
  const lines = readSource(rel).split('\n');
  const s = lines.findIndex((l) => startRe.test(l));
  if (s < 0) throw new Error(`extractRange: ${startRe} not found in ${rel}`);
  let e = s;
  while (e < lines.length && !endRe.test(lines[e])) e++;
  if (e >= lines.length) throw new Error(`extractRange: ${endRe} not found after ${startRe} in ${rel}`);
  return dedent(lines.slice(s, e + 1));
}

function dedent(lines) {
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(ind));
}

function constant(rel, name) {
  const m = readSource(rel).match(new RegExp(`\\b${name}\\s*=\\s*([^;]+);`));
  if (!m) throw new Error(`constant ${name} not found in ${rel}`);
  return m[1].trim();
}

/** Facts quoted in several documents, read from the code so they always agree with it. */
const FACTS = {
  dining: +constant('model/Reservation.java', 'DINING_MINUTES'),
  hold: +constant('service/RestaurantManager.java', 'HOLD_WINDOW_MINUTES'),
  late: +constant('service/RestaurantManager.java', 'LATE_GRACE_MINUTES'),
  bussingMs: +constant('service/RestaurantManager.java', 'long bussingDelayMs'),
  monitorMs: +constant('Main.java', 'MONITOR_INTERVAL_MS').replace(/_/g, ''),
  autosaveMs: +constant('gui/MainFrame.java', 'AUTOSAVE_DELAY_MS'),
  maxParty: +constant('util/Validator.java', 'MAX_PARTY_SIZE'),
  minParty: +constant('util/Validator.java', 'MIN_PARTY_SIZE'),
  maxCapacity: +constant('util/Validator.java', 'MAX_TABLE_CAPACITY'),
  maxDays: +constant('util/Validator.java', 'MAX_DAYS_AHEAD'),
  slot: +constant('util/Validator.java', 'SLOT_MINUTES'),
  minutesPerParty: +constant('model/Waitlist.java', 'MINUTES_PER_PARTY_AHEAD'),
  spinnerMax: +constant('gui/GuiUtil.java', 'SPINNER_MAX'),
  open: constant('util/Validator.java', 'OPENING_TIME').match(/\((\d+),\s*(\d+)\)/).slice(1).map((n) => n.padStart(2, '0')).join(':'),
  last: constant('util/Validator.java', 'LAST_SEATING').match(/\((\d+),\s*(\d+)\)/).slice(1).map((n) => n.padStart(2, '0')).join(':'),
};
FACTS.bussingS = FACTS.bussingMs / 1000;
FACTS.monitorS = FACTS.monitorMs / 1000;
FACTS.autosaveS = FACTS.autosaveMs / 1000;

function listSourceFiles() {
  const out = [];
  (function walk(dir) {
    for (const f of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.java')) out.push(path.relative(SRC, p));
    }
  })(SRC);
  return out;
}

// ------------------------------------------------------------------ text helpers
function runs(parts, base = {}) {
  if (parts === undefined || parts === null) return [];
  if (!Array.isArray(parts)) parts = [parts];
  return parts.map((p) => (typeof p === 'string' ? new TextRun({ text: p, ...base }) : new TextRun({ ...base, ...p })));
}
const B = (text) => ({ text, bold: true });
const I = (text) => ({ text, italics: true });
const C = (text) => ({ text, font: MONO, size: 19 });

const P = (parts, opts = {}) => new Paragraph({ children: runs(parts), spacing: { after: 200, line: 276 }, ...opts });
const H1 = (text, opts = {}) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)], ...opts });
const H2 = (text, opts = {}) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)], ...opts });
const H3 = (text, opts = {}) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)], ...opts });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const bullet = (parts, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level }, children: runs(parts), spacing: { after: 80, line: 276 },
});

let listCounter = 0;
/** A numbered list that restarts at 1. Items can be strings/arrays, or {text, sub: [...]} for nested bullets. */
function numbered(items, { spacingAfter = 80 } = {}) {
  listCounter += 1;
  const instance = listCounter;
  const out = [];
  for (const it of items) {
    const isObj = it && typeof it === 'object' && !Array.isArray(it) && it.text !== undefined;
    const text = isObj ? it.text : it;
    out.push(new Paragraph({ numbering: { reference: 'numbers', level: 0, instance }, children: runs(text), spacing: { after: spacingAfter, line: 276 } }));
    for (const s of (isObj && Array.isArray(it.sub) ? it.sub : [])) {
      out.push(new Paragraph({ numbering: { reference: 'bullets', level: 1 }, children: runs(s), spacing: { after: 60, line: 276 } }));
    }
  }
  return out;
}

// ------------------------------------------------------------------ tables
const lineBorder = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: lineBorder, bottom: lineBorder, left: lineBorder, right: lineBorder };

function cell(content, width, { header = false, fill, mono = false, size = 19, align } = {}) {
  const paras = Array.isArray(content) && content.length && content[0] instanceof Paragraph ? content
    : (Array.isArray(content) && content.some((x) => Array.isArray(x)) ? content : [content]).map((c) => new Paragraph({
      alignment: align, spacing: { after: 0, line: 252 },
      children: runs(c, { size, bold: header || undefined, ...(mono ? { font: MONO, size: size - 1 } : {}) }),
    }));
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    shading: header ? { type: ShadingType.CLEAR, fill: 'EFEFEF', color: 'auto' } : fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    verticalAlign: VerticalAlign.TOP,
    children: paras,
  });
}

/**
 * table(headers, rows, widths, opts) - widths in DXA must sum to the table width (default CONTENT_W).
 * opts.mono: array of column indexes rendered in monospace.
 */
function table(headers, rows, widths, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  if (Math.abs(total - (opts.total || CONTENT_W)) > 2 && !opts.allowNarrow) {
    throw new Error(`table widths sum to ${total}, expected ${opts.total || CONTENT_W}: ${headers.join('|')}`);
  }
  const mono = opts.mono || [];
  const trs = [];
  if (headers) trs.push(new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => cell(h, widths[i], { header: true, size: opts.size || 19 })) }));
  rows.forEach((r) => trs.push(new TableRow({
    cantSplit: opts.cantSplit !== false,
    children: r.map((c, i) => cell(c, widths[i], { mono: mono.includes(i), size: opts.size || 19, fill: opts.fills ? opts.fills(i) : undefined })),
  })));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: trs });
}

/** Two-column "Type this | What it does" command table used by the setup guide. */
function commandTable(rows) {
  return table(['Type this', 'What it does'], rows.map(([cmd, what]) => [
    cmd.split('\n').map((l) => new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: l || ' ', font: MONO, size: 18 })] })),
    what,
  ]), [4300, 4726]);
}

/** A tinted call-out box (single-cell table). */
function callout(title, parts, fill = 'F3F6F9') {
  const children = [];
  if (title) children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: title, bold: true, size: 21 })] }));
  for (const p of parts) children.push(p instanceof Paragraph ? p : new Paragraph({ spacing: { after: 80, line: 264 }, children: runs(p, { size: 20 }) }));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W], layout: TableLayoutType.FIXED,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.SINGLE, size: 18, color: '8A8A8A' } },
      shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
      margins: { top: 120, bottom: 60, left: 200, right: 200 },
      children,
    })] })],
  });
}
const gap = (after = 160) => new Paragraph({ children: [], spacing: { after } });

// ------------------------------------------------------------------ code blocks
function code(lines, { size = 15, title } = {}) {
  const out = [];
  if (title) out.push(new Paragraph({ keepNext: true, spacing: { before: 60, after: 40 }, children: [new TextRun({ text: title, font: MONO, size: 16, color: GREY })] }));
  lines.forEach((line, i) => out.push(new Paragraph({
    keepLines: true, keepNext: i < lines.length - 1 && lines.length < 40,
    children: [new TextRun({ text: line.length ? line.replace(/\t/g, '    ') : ' ', font: MONO, size })],
    shading: { type: ShadingType.CLEAR, fill: 'F5F5F5', color: 'auto' },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: 'BFBFBF', space: 4 },
      right: { style: BorderStyle.SINGLE, size: 6, color: 'F5F5F5', space: 4 },
      ...(i === 0 ? { top: { style: BorderStyle.SINGLE, size: 6, color: 'F5F5F5', space: 2 } } : {}),
      ...(i === lines.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'F5F5F5', space: 2 } } : {}),
    },
    spacing: { before: 0, after: i === lines.length - 1 ? 200 : 0, line: 228 },
    indent: { left: 120, right: 120 },
  })));
  return out;
}

// ------------------------------------------------------------------ figures
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
let figureNo = 0;
let tableNo = 0;
function resetCounters() { figureNo = 0; tableNo = 0; }
/** Image scaled to `widthPx` (96 dpi pixels; 600 = full content width on A4 with 1" margins). */
function figure(file, widthPx, caption, { maxHeightPx = 840 } = {}) {
  const { w, h } = pngSize(file);
  let width = widthPx;
  let height = Math.round(widthPx * h / w);
  if (height > maxHeightPx) { height = maxHeightPx; width = Math.round(maxHeightPx * w / h); }
  figureNo += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 80 },
      children: [new ImageRun({ type: 'png', data: fs.readFileSync(file), transformation: { width, height },
        altText: { title: `Figure ${figureNo}`, description: caption, name: `figure${figureNo}` } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 280 },
      children: [new TextRun({ text: `Figure ${figureNo}: `, bold: true, size: 19, color: GREY }), new TextRun({ text: caption, italics: true, size: 19, color: GREY })] }),
  ];
}
function tableCaption(text) {
  tableNo += 1;
  return new Paragraph({ keepNext: true, spacing: { before: 160, after: 100 },
    children: [new TextRun({ text: `Table ${tableNo}: `, bold: true, size: 19, color: GREY }), new TextRun({ text, italics: true, size: 19, color: GREY })] });
}
const nextTableNo = () => tableNo + 1;
const nextFigureNo = () => figureNo + 1;

// ------------------------------------------------------------------ document shell
const fontFile = (f) => fs.readFileSync(path.join(__dirname, 'fonts', f));
function makeDocument({ title, sections, footerText }) {
  const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
    ...(footerText ? [new TextRun({ text: footerText + '   |   ', size: 16, color: '888888' })] : []),
    new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
  ] })] });
  return new Document({
    creator: STUDENT.name,
    title,
    fonts: [
      { name: 'Inter', data: fontFile('Inter-Regular.ttf'), characterSet: CharacterSet.ANSI },
      { name: 'Inter__B', data: fontFile('Inter-Bold.ttf'), characterSet: CharacterSet.ANSI },
      { name: 'Inter__I', data: fontFile('Inter-Italic.ttf'), characterSet: CharacterSet.ANSI },
      { name: 'Inter__BI', data: fontFile('Inter-BoldItalic.ttf'), characterSet: CharacterSet.ANSI },
    ],
    styles: {
      default: { document: { run: { font: FONT, size: 22 }, paragraph: { spacing: { line: 276 } } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 26, bold: true, color: '000000' },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0, keepNext: true } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 22, bold: true, color: '000000' },
          paragraph: { spacing: { before: 260, after: 140 }, outlineLevel: 1, keepNext: true } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: FONT, size: 22, bold: true, italics: true, color: '333333' },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2, keepNext: true } },
      ],
    },
    numbering: { config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '\u25CF', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { size: 16 } } },
        { level: 1, format: LevelFormat.BULLET, text: '\u25CB', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } }, run: { size: 16 } } },
      ] },
      { reference: 'numbers', levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ] },
    ] },
    sections: sections.map((s) => ({
      properties: { page: { size: s.landscape ? { ...A4, orientation: 'landscape' } : A4,
        margin: { top: MARGIN, bottom: MARGIN, left: s.margin || MARGIN, right: s.margin || MARGIN } }, ...(s.properties || {}) },
      footers: s.noFooter ? undefined : { default: footer },
      children: s.children.flat(Infinity),
    })),
  });
}

async function save(doc, outFile) {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outFile, buf);
  return outFile;
}

module.exports = {
  ROOT, SRC, DOCS, FONT, MONO, GREY, ROLLGREY, A4, MARGIN, CONTENT_W, STUDENT, FACTS,
  readSource, extractBlock, extractRange, listSourceFiles,
  runs, B, I, C, P, H1, H2, H3, pageBreak, bullet, numbered, table, commandTable, callout, gap, code,
  figure, tableCaption, nextTableNo, nextFigureNo, resetCounters, pngSize, makeDocument, save,
  docx: require('docx'),
};
