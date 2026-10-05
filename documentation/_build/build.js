// Builds every document into docs/. Usage: node build.js [report|setup|concepts|viva|demo ...]
const path = require('path');
const { execFileSync } = require('child_process');
const L = require('./lib');

const DOCS = {
  report: ['./report', 'Project_Report.docx'],
  setup: ['./setup', 'Setup_and_Run_Guide.docx'],
  concepts: ['./concepts', 'Concepts_and_Study_Guide.docx'],
  viva: ['./viva', 'Viva_Questions_and_Answers.docx'],
  demo: ['./demo', 'Live_Demo_Script.docx'],
  presentation: ['./presentation', 'Presentation_Guide.docx'],
  deck: ['./deck', 'Presentation_Slides.pptx'],
};

(async () => {
  const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DOCS);
  for (const key of wanted) {
    const [mod, file] = DOCS[key];
    L.resetCounters();
    const out = path.join(L.DOCS, file);
    await require(mod)(out);
    if (out.endsWith('.docx')) execFileSync('python3', [path.join(__dirname, 'fixfonts.py'), out], { stdio: 'inherit' });
    console.log('built', file);
  }
})().catch((e) => { console.error(e); process.exit(1); });
