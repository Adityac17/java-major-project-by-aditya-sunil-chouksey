// Builds docs/Presentation_Slides.pptx from slides_data.js (the same data the Presentation Guide uses).
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa6');
const L = require('./lib');
const { SLIDES } = require('./slides_data');

const S = L.STUDENT;
const THEME = {
  name: 'ITM Restaurant',
  headFontFace: 'Calibri',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '1F1F24', lt1: 'FFFFFF', dk2: '5C1232', lt2: 'F6F0F3',
    accent1: '8E1F4A', accent2: 'D99A1E', accent3: '2E8B57', accent4: 'C0392B', accent5: '3F6EA8', accent6: '6B7280',
    hlink: '3F6EA8', folHlink: '6B7280',
  },
};
const HEX = THEME.colors;

async function icon(name, color = '#FFFFFF') {
  const Icon = fa[name];
  if (!Icon) throw new Error(`icon ${name} not found`);
  const svg = renderToStaticMarkup(React.createElement(Icon, { color, size: 256 }));
  const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return 'image/png;base64,' + png.toString('base64');
}

async function croppedFlowchart() {
  const file = path.join(L.DOCS, 'uml', 'flowchart-waitlist-notification.png');
  const { width, height } = await sharp(file).metadata();
  // right column ("B. Guests leave - table released") of the 1240 x 1060 diagram, rendered at 2x
  const sx = width / 1240, sy = height / 1060;
  const box = { left: Math.round(700 * sx), top: Math.round(60 * sy), width: Math.round(530 * sx), height: Math.round(870 * sy) };
  const buf = await sharp(file).extract(box).png().toBuffer();
  return { data: 'image/png;base64,' + buf.toString('base64'), ratio: box.width / box.height };
}

module.exports = async function build(outFile) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 in
  pres.author = S.name;
  pres.title = `${S.title} - Presentation`;
  pres.subject = `${S.subject} - ${S.caseStudy}`;
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const shadow = () => ({ type: 'outer', color: '000000', opacity: 0.18, blur: 6, offset: 2, angle: 90 });

  // ---------------------------------------------------------------- layouts
  const footer = `${S.title}  |  ${S.caseStudy}`;
  const dots = (x, y, d) => [C.accent3, C.accent2, C.accent4].map((col, i) => (
    { ellipse: { x: x + i * (d + 0.08), y, w: d, h: d, fill: { color: col }, line: { color: col } } }));

  pres.defineSlideMaster({
    title: 'DARK',
    background: { color: C.text2 },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.7, w: 6.4, h: 1.5, fontSize: 34, bold: true, color: C.background1, align: 'left', valign: 'top', margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 3.35, w: 6.4, h: 1.4, fontSize: 16, color: C.background2, align: 'left', valign: 'top', margin: 0 }, text: '' } },
    ],
  });
  pres.defineSlideMaster({
    title: 'CONTENT',
    background: { color: C.background1 },
    margin: [0.5, 0.5, 0.6, 0.5],
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.32, w: 7.6, h: 0.7, fontSize: 32, bold: true, color: C.text2, align: 'left', valign: 'middle', margin: 0 }, text: '' } },
      ...dots(8.86, 0.57, 0.16),
      { text: { text: footer, options: { x: 0.5, y: 5.2, w: 7.5, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 } } },
    ],
    slideNumber: { x: 9.05, y: 5.2, w: 0.45, h: 0.3, fontSize: 10, color: C.accent6, align: 'right' },
  });

  const ic = {};
  for (const n of ['FaCalendarXmark', 'FaChair', 'FaUserClock', 'FaBell', 'FaLayerGroup', 'FaUserTie', 'FaGears', 'FaFloppyDisk',
    'FaCheck', 'FaDatabase', 'FaCommentSms', 'FaLink', 'FaUtensils']) ic[n] = await icon(n);

  const notes = (slide, sd) => slide.addNotes(`[${sd.time}]  ${sd.say.replace(/"/g, '')}`);
  const circleIcon = (slide, x, y, d, col, data, name) => {
    slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: col }, line: { color: col }, objectName: `${name}-circle` });
    const p = d * 0.24;
    slide.addImage({ data, x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: `${name}-icon`, altText: name });
  };
  const sd = (n) => SLIDES.find((s) => s.n === n);

  // ---------------------------------------------------------------- 1 title
  pres.addSection({ title: 'Opening' });
  {
    const d = sd(1);
    const s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Opening' });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.55, w: 2.75, h: 0.95, rectRadius: 0.08, fill: { color: C.background1 }, line: { color: C.background1 }, objectName: 'logo-card' });
    s.addImage({ path: path.join(__dirname, 'itm-logo.png'), x: 0.75, y: 0.66, w: 2.45, h: 0.77, objectName: 'logo', altText: 'ITM Skills University logo' });
    s.addText(d.title, { placeholder: 'title' });
    s.addText(d.lines.map((t, i) => ({ text: t, options: { breakLine: i < d.lines.length - 1, bold: i === 1, fontSize: i === 1 ? 18 : 16 } })), { placeholder: 'body' });
    const labels = ['Available', 'Reserved', 'Occupied'];
    [C.accent3, C.accent2, C.accent4].forEach((col, i) => {
      const x = 7.55 + (i % 2) * 1.05, y = 1.05 + i * 1.15;
      s.addShape(pres.shapes.OVAL, { x, y, w: 0.85, h: 0.85, fill: { color: col }, line: { color: C.background1, width: 2 }, objectName: `status-${labels[i]}` });
      s.addText(labels[i], { x: x - 0.35, y: y + 0.88, w: 1.55, h: 0.3, fontSize: 12, color: C.background1, align: 'center', margin: 0, isTextBox: true, objectName: `status-label-${labels[i]}` });
    });
    notes(s, d);
  }

  // ---------------------------------------------------------------- 2 problem
  {
    const d = sd(2);
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Opening' });
    s.addText(d.title, { placeholder: 'title' });
    const icons = ['FaCalendarXmark', 'FaChair', 'FaUserClock'];
    d.cards.forEach(([h, desc], i) => {
      const y = 1.3 + i * 1.12;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 5.3, h: 0.95, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `problem-card-${i + 1}` });
      circleIcon(s, 0.72, y + 0.2, 0.55, C.accent4, ic[icons[i]], `problem-${i + 1}`);
      s.addText([{ text: h, options: { bold: true, fontSize: 17, color: C.text1, breakLine: true } }, { text: desc, options: { fontSize: 14, color: C.accent6 } }],
        { x: 1.5, y: y + 0.1, w: 4.15, h: 0.75, valign: 'middle', margin: 0, isTextBox: true, objectName: `problem-text-${i + 1}` });
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.15, y: 1.3, w: 3.35, h: 3.19, rectRadius: 0.1, fill: { color: C.accent1 }, line: { color: C.accent1 }, shadow: shadow(), objectName: 'goal-panel' });
    s.addImage({ data: ic.FaBell, x: 6.45, y: 1.6, w: 0.5, h: 0.5, objectName: 'goal-icon', altText: 'bell' });
    s.addText('GOAL', { x: 6.45, y: 2.25, w: 2.8, h: 0.35, fontSize: 14, bold: true, color: C.background2, charSpacing: 3, margin: 0, isTextBox: true, objectName: 'goal-label' });
    s.addText(d.goal, { x: 6.45, y: 2.62, w: 2.85, h: 1.6, fontSize: 22, bold: true, color: C.background1, valign: 'top', margin: 0, isTextBox: true, objectName: 'goal-text' });
    notes(s, d);
  }

  // ---------------------------------------------------------------- 3 objectives & modules
  {
    const d = sd(3);
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Opening' });
    s.addText(d.title, { placeholder: 'title' });
    d.stats.forEach(([num, word], i) => {
      const y = 1.25 + i * 1.12;
      s.addText(num, { x: 0.5, y, w: 1.35, h: 0.9, fontSize: 48, bold: true, color: C.accent1, valign: 'middle', margin: 0, isTextBox: true, objectName: `stat-num-${i + 1}` });
      s.addText(word, { x: 1.85, y, w: 1.6, h: 0.9, fontSize: 16, color: C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: `stat-word-${i + 1}` });
    });
    const cols = [C.accent5, C.accent1, C.accent2, C.accent3, C.accent4, C.accent5, C.accent1];
    d.modules.forEach((m, i) => {
      const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
      const x = 3.75 + col * 2.95, y = 1.3 + row * 0.84;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.75, h: 0.68, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `module-tile-${i + 1}` });
      s.addShape(pres.shapes.OVAL, { x: x + 0.12, y: y + 0.12, w: 0.44, h: 0.44, fill: { color: cols[i] }, line: { color: cols[i] }, objectName: `module-num-bg-${i + 1}` });
      s.addText(String(i + 1), { x: x + 0.12, y: y + 0.12, w: 0.44, h: 0.44, fontSize: 15, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: `module-num-${i + 1}` });
      s.addText(m, { x: x + 0.66, y, w: 2.02, h: 0.68, fontSize: 14, bold: true, color: C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: `module-name-${i + 1}` });
    });
    notes(s, d);
  }

  // ---------------------------------------------------------------- 4 architecture
  pres.addSection({ title: 'How it works' });
  {
    const d = sd(4);
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'How it works' });
    s.addText(d.title, { placeholder: 'title' });
    const img = L.pngSize(path.join(L.DOCS, d.image));
    const h = 3.75, w = h * img.w / img.h;
    s.addImage({ path: path.join(L.DOCS, d.image), x: 0.5, y: 1.22, w, h, objectName: 'architecture-diagram', altText: 'System architecture diagram' });
    const icons = ['FaLayerGroup', 'FaUserTie', 'FaGears', 'FaFloppyDisk'];
    d.points.forEach(([hd, desc], i) => {
      const y = 1.25 + i * 0.95;
      circleIcon(s, 5.95, y + 0.05, 0.42, C.accent1, ic[icons[i]], `arch-${i + 1}`);
      s.addText([{ text: hd, options: { bold: true, fontSize: 15, color: C.text1, breakLine: true } }, { text: desc, options: { fontSize: 14, color: C.accent6 } }],
        { x: 6.5, y, w: 3.0, h: 0.85, valign: 'top', margin: 0, isTextBox: true, objectName: `arch-text-${i + 1}` });
    });
    notes(s, d);
  }

  // ---------------------------------------------------------------- 5 data structures
  {
    const d = sd(5);
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'How it works' });
    s.addText(d.title, { placeholder: 'title' });
    d.cards.forEach(([name, holds, why], i) => {
      const x = 0.5 + (i % 2) * 4.6, y = 1.2 + Math.floor(i / 2) * 1.5;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 4.4, h: 1.32, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `ds-card-${i + 1}` });
      s.addText([
        { text: name, options: { bold: true, fontSize: 20, color: C.accent1, breakLine: true } },
        { text: holds, options: { fontSize: 14, color: C.text1, breakLine: true } },
        { text: why, options: { fontSize: 14, italic: true, color: C.accent6 } },
      ], { x: x + 0.25, y: y + 0.12, w: 3.95, h: 1.1, valign: 'top', margin: 0, isTextBox: true, objectName: `ds-text-${i + 1}` });
    });
    s.addText('TableStatus enum', { x: 0.5, y: 4.32, w: 2.0, h: 0.45, fontSize: 15, bold: true, color: C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: 'enum-label' });
    const chipCols = [C.accent3, C.accent2, C.accent4];
    d.enumLine.forEach((v, i) => {
      const x = 2.55 + i * 1.95;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.34, w: 1.8, h: 0.42, rectRadius: 0.21, fill: { color: chipCols[i] }, line: { color: chipCols[i] }, objectName: `enum-chip-${i + 1}` });
      s.addText(v, { x, y: 4.34, w: 1.8, h: 0.42, fontSize: 14, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: `enum-chip-text-${i + 1}` });
    });
    notes(s, d);
  }

  // ---------------------------------------------------------------- 6 algorithms
  {
    const d = sd(6);
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'How it works' });
    s.addText(d.title, { placeholder: 'title' });
    d.steps.forEach(([hd, desc], i) => {
      const y = 1.22 + i * 0.95;
      s.addShape(pres.shapes.OVAL, { x: 0.5, y: y + 0.08, w: 0.55, h: 0.55, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: `step-num-bg-${i + 1}` });
      s.addText(String(i + 1), { x: 0.5, y: y + 0.08, w: 0.55, h: 0.55, fontSize: 18, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: `step-num-${i + 1}` });
      s.addText([{ text: hd, options: { bold: true, fontSize: 17, color: C.text1, breakLine: true } }, { text: desc, options: { fontSize: 14, color: C.accent6 } }],
        { x: 1.25, y, w: 5.0, h: 0.8, valign: 'middle', margin: 0, isTextBox: true, objectName: `step-text-${i + 1}` });
    });
    const fc = await croppedFlowchart();
    const h = 3.75, w = h * fc.ratio;
    s.addImage({ data: fc.data, x: 9.5 - w, y: 1.15, w, h, objectName: 'release-flowchart', altText: 'Flowchart: table released, notifier thread offers the table' });
    s.addText('Flowchart 2 - table released', { x: 9.5 - w - 0.2, y: 4.92, w: w + 0.2, h: 0.25, fontSize: 10, italic: true, color: C.accent6, align: 'center', margin: 0, isTextBox: true, objectName: 'release-caption' });
    notes(s, d);
  }

  // ---------------------------------------------------------------- 7 testing
  pres.addSection({ title: 'Results' });
  {
    const d = sd(7);
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Results' });
    s.addText(d.title, { placeholder: 'title' });
    s.addText(d.stat[0], { x: 0.5, y: 1.15, w: 4.2, h: 1.0, fontSize: 60, bold: true, color: C.accent3, valign: 'middle', margin: 0, isTextBox: true, objectName: 'test-stat' });
    s.addText(d.stat[1], { x: 0.5, y: 2.1, w: 4.2, h: 0.4, fontSize: 18, color: C.text1, margin: 0, isTextBox: true, objectName: 'test-stat-label' });
    d.points.forEach((t, i) => {
      const y = 2.7 + i * 0.58;
      circleIcon(s, 0.5, y + 0.04, 0.34, C.accent3, ic.FaCheck, `check-${i + 1}`);
      s.addText(t, { x: 1.0, y, w: 3.75, h: 0.5, fontSize: 14, color: C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: `check-text-${i + 1}` });
    });
    const img = L.pngSize(path.join(L.DOCS, d.image));
    const w = 4.6, h = w * img.h / img.w;
    s.addImage({ path: path.join(L.DOCS, d.image), x: 4.95, y: 1.35, w, h, shadow: shadow(), objectName: 'validation-screenshot', altText: 'Party size 21 rejected with an error dialog' });
    s.addText('Real screenshot: party of 21 typed into the booking form', { x: 4.95, y: 1.35 + h + 0.08, w, h: 0.3, fontSize: 11, italic: true, color: C.accent6, align: 'center', margin: 0, isTextBox: true, objectName: 'screenshot-caption' });
    notes(s, d);
  }

  // ---------------------------------------------------------------- 8 conclusion
  {
    const d = sd(8);
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'Results' });
    s.addText(d.title, { placeholder: 'title' });
    d.done.forEach(([num, word], i) => {
      const x = 0.5 + i * 3.05;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.2, w: 2.85, h: 1.2, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `done-tile-${i + 1}` });
      s.addText(num, { x: x + 0.25, y: 1.25, w: 1.2, h: 1.1, fontSize: 44, bold: true, color: C.accent1, valign: 'middle', margin: 0, isTextBox: true, objectName: `done-num-${i + 1}` });
      s.addText(word, { x: x + 1.35, y: 1.25, w: 1.4, h: 1.1, fontSize: 15, color: C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: `done-word-${i + 1}` });
    });
    s.addText(d.extra, { x: 0.5, y: 2.55, w: 9.0, h: 0.4, fontSize: 15, italic: true, color: C.accent6, margin: 0, isTextBox: true, objectName: 'done-extra' });
    s.addText('Next steps', { x: 0.5, y: 3.1, w: 4, h: 0.4, fontSize: 20, bold: true, color: C.text2, margin: 0, isTextBox: true, objectName: 'next-header' });
    const icons = ['FaDatabase', 'FaCommentSms', 'FaLink'];
    d.next.forEach(([hd, desc], i) => {
      const x = 0.5 + i * 3.05;
      circleIcon(s, x, 3.68, 0.5, C.accent5, ic[icons[i]], `next-${i + 1}`);
      s.addText([{ text: hd, options: { bold: true, fontSize: 15, color: C.text1, breakLine: true } }, { text: desc, options: { fontSize: 14, color: C.accent6 } }],
        { x: x + 0.62, y: 3.6, w: 2.3, h: 1.0, valign: 'top', margin: 0, isTextBox: true, objectName: `next-text-${i + 1}` });
    });
    notes(s, d);
  }

  // ---------------------------------------------------------------- 9 thank you
  {
    const d = sd(9);
    const s = pres.addSlide({ masterName: 'DARK', sectionTitle: 'Results' });
    s.addText(d.title, { placeholder: 'title', fontSize: 48 });
    s.addText(d.lines.map((t, i) => ({ text: t, options: { breakLine: i < d.lines.length - 1, fontSize: i === 0 ? 26 : 16, bold: i === 0 } })), { placeholder: 'body' });
    [C.accent3, C.accent2, C.accent4].forEach((col, i) => {
      s.addShape(pres.shapes.OVAL, { x: 7.6 + i * 0.62, y: 4.35, w: 0.48, h: 0.48, fill: { color: col }, line: { color: C.background1, width: 1.5 }, objectName: `closing-dot-${i + 1}` });
    });
    s.addImage({ data: ic.FaUtensils, x: 8.0, y: 1.6, w: 1.2, h: 1.2, transparency: 20, objectName: 'closing-icon', altText: 'utensils' });
    notes(s, d);
  }

  await pres.writeFile({ fileName: outFile });
  const { applyTheme } = require(process.env.PPTX_SKILL + '/scripts/apply_theme.js');
  await applyTheme(outFile, THEME);
  return outFile;
};
